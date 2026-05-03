#!/usr/bin/env node
import { JSDOM, VirtualConsole } from "jsdom";
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const TEMPLATE_PATH = join(ROOT, "index.template.html");
const OUT_PATH = join(ROOT, "index.html");
const ASSETS_DIR = join(ROOT, "public", "assets");

function findBundle() {
  const files = readdirSync(ASSETS_DIR);
  // Exclude `.classic.js` siblings (those are wrappers we emit ourselves).
  const js = files.find((f) => /^index-[^.]+\.js$/.test(f) && !f.endsWith(".classic.js"));
  const css = files.find((f) => /^index-.*\.css$/.test(f));
  if (!js) throw new Error("Could not find bundled JS in public/assets");
  if (js.includes(".classic.")) {
    throw new Error(`[prerender] refusing to use wrapper as source: ${js}`);
  }
  return { js, css };
}

function cleanupStaleWrappers(currentBundleName) {
  const expected = currentBundleName.replace(/\.js$/, ".classic.js");
  let removed = 0;
  for (const f of readdirSync(ASSETS_DIR)) {
    if (/^index-.*\.classic\.js$/.test(f) && f !== expected) {
      unlinkSync(join(ASSETS_DIR, f));
      removed++;
    }
  }
  if (removed > 0) console.log(`[prerender] removed ${removed} stale .classic.js wrapper(s)`);
}

async function main() {
  const { js: bundleName, css: cssName } = findBundle();
  console.log(`[prerender] bundle: ${bundleName}, css: ${cssName ?? "(none)"}`);

  let html = readFileSync(TEMPLATE_PATH, "utf8");

  const bundleSrc = readFileSync(join(ASSETS_DIR, bundleName), "utf8");

  const virtualConsole = new VirtualConsole();
  virtualConsole.on("error", (e) => console.error("[jsdom error]", e?.message ?? e));
  virtualConsole.on("jsdomError", (e) => console.error("[jsdom internal]", e?.message ?? e));

  const dom = new JSDOM(html, {
    url: "http://localhost/landing/",
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole,
  });

  const { window } = dom;
  const { document } = window;

  // Polyfill fetch as no-op (bundle doesn't fetch translations — they're inline)
  if (!window.fetch) {
    window.fetch = async () => ({
      ok: false, status: 404, text: async () => "", json: async () => ({}),
    });
  }

  // Remove the existing module script tag — we'll execute the bundle manually
  document.querySelectorAll('script[src*="/assets/index-"]').forEach((el) => el.remove());

  // Wrap bundle in async IIFE so top-level await works as a classic script
  const wrapped = `
    (async function mwrdPrerender(){
      try {
        ${bundleSrc}
        window.__mwrdBundleResolved = true;
      } catch (err) {
        window.__mwrdBundleError = err;
        console.error("[bundle threw]", err && err.stack || err);
      }
    })();
  `;

  // Execute in window context. With runScripts: 'outside-only', window.eval runs in
  // the window's global scope (appending a script tag does NOT execute it).
  window.eval(wrapped);

  // Poll for bundle completion: body must have class mwrd-enhanced
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (document.body && document.body.classList.contains("mwrd-enhanced")) break;
    if (window.__mwrdBundleError) throw window.__mwrdBundleError;
    await new Promise((r) => setTimeout(r, 50));
  }

  if (!document.body.classList.contains("mwrd-enhanced")) {
    throw new Error(
      "[prerender] timeout: body never received class 'mwrd-enhanced'. " +
      `bundleResolved=${!!window.__mwrdBundleResolved} bundleError=${window.__mwrdBundleError?.message ?? "none"}`
    );
  }

  // Give microtasks one more tick to settle (any post-init mutations)
  await new Promise((r) => setTimeout(r, 200));

  // Sanity check: no Grovia text should remain in the visible DOM
  const fullText = document.body.textContent || "";
  const groviaCount = (fullText.match(/Grovia/gi) || []).length;
  if (groviaCount > 0) {
    console.warn(`[prerender] WARNING: still found ${groviaCount} 'Grovia' occurrences in body text — bundle may not have finished`);
  }

  // Re-add the bundle script so interactivity (lang switch, accordion, mobile menu) still
  // works on the live page. The bundle is a self-contained IIFE with no top-level
  // import/export, so we load it as a classic `defer` script instead of `type=module`.
  // This avoids Vite's HTML import-analysis pipeline, which otherwise injects a
  // cartographer plugin script right after our tag — that injected script contains a
  // literal `</script>` inside its source and breaks HTML parsing, producing a phantom
  // `<body>` and dumping the rest of the bundle as visible text on the page.
  // The bundle is ESM with top-level `await` (i18next init), so it cannot be
  // loaded as a classic `<script defer>`. We also can't load it as
  // `<script type="module">` from /public — Vite's HTML import-analysis pipeline
  // tries to transform a public asset and fails ("can only be referenced via
  // HTML tags"), and (in earlier setups) cartographer would inject a script
  // containing a literal `</script>` right after our tag and corrupt the HTML.
  // Workaround: emit a sibling file that wraps the bundle in an async IIFE and
  // reference that as a classic `defer` script. Top-level awaits become awaits
  // inside an async function; the file is plain JS, no module graph involved.
  const wrappedBundleName = bundleName.replace(/\.js$/, ".classic.js");
  cleanupStaleWrappers(bundleName);
  // Force strict mode inside the wrapper to preserve the original ESM bundle's
  // strict-mode semantics (modules are always strict; classic scripts are not).
  const wrappedSrc = `/* wrapped by prerender.mjs — async IIFE so top-level await works as classic script */\n(async function mwrdLandingBundle(){\n"use strict";\n${bundleSrc}\n})();\n`;
  writeFileSync(join(ASSETS_DIR, wrappedBundleName), wrappedSrc, "utf8");
  const liveScript = document.createElement("script");
  liveScript.setAttribute("defer", "");
  liveScript.setAttribute("src", `./assets/${wrappedBundleName}`);
  document.head.appendChild(liveScript);

  // Strip Webflow template attribution attributes from <html> (data-wf-domain="grovia-…",
  // data-wf-page, data-wf-site). They are template metadata, not needed at runtime.
  const htmlEl = document.documentElement;
  for (const attr of [...htmlEl.attributes]) {
    if (attr.name.startsWith("data-wf-")) htmlEl.removeAttribute(attr.name);
  }

  // Drop the `mwrd-enhanced` marker class from the static HTML so the source looks clean.
  // The bundle re-adds it on hydration as an idempotency guard.
  if (document.body.classList.contains("mwrd-enhanced")) {
    document.body.classList.remove("mwrd-enhanced");
  }

  // Drop `w-mod-ix` from <html>. The Webflow IX2 chunk loaded later (webflow.d688….js)
  // sets this class itself once it has bound interactions to elements with `data-w-id`.
  // If we leave it in the static HTML, IX2 sees the marker and skips initialization,
  // and on-scroll/hover animations never fire.
  if (htmlEl.classList.contains("w-mod-ix")) {
    htmlEl.classList.remove("w-mod-ix");
  }

  // Defer all synchronous external <script src="…"> tags so they don't block the HTML
  // parser / DOMContentLoaded. Webflow ships jquery + webflow.js as render-blocking
  // sync scripts in the head and body; with the page fully prerendered we don't need
  // them inline, only by the time the DOM is interactive. Module scripts and the
  // Replit dev banner are left alone.
  let deferred = 0;
  for (const s of document.querySelectorAll("script[src]")) {
    const type = s.getAttribute("type") || "";
    if (type === "module") continue; // already deferred
    if (s.hasAttribute("defer") || s.hasAttribute("async")) continue;
    if (s.id === "replit-dev-banner") continue; // dev-only injected by vite plugin
    // Skip the WebFont loader: the inline `WebFont.load(...)` call sits right
    // after it in the head and runs synchronously. Deferring the loader would
    // make `WebFont` undefined when that inline call executes.
    const src = s.getAttribute("src") || "";
    if (src.includes("webfont.js")) continue;
    s.setAttribute("defer", "");
    deferred++;
  }
  if (deferred > 0) {
    console.log(`[prerender] added defer to ${deferred} sync external scripts`);
  }

  // The Webflow source uses XHTML-style self-closing tags with unquoted attributes
  // (e.g. `<path fill=currentColor/>`). The HTML parser treats the trailing `/` as
  // part of the unquoted attribute value, so jsdom re-serializes them as
  // `fill="currentColor/"` — which is invalid CSS color syntax and makes inline SVG
  // icons fall back to default fill (black on dark backgrounds = invisible icons).
  // Walk every element and strip a trailing `/` from any attribute value to repair.
  let attrFixed = 0;
  const walker = document.createTreeWalker(document.documentElement, 1 /* ELEMENT */);
  let node = walker.currentNode;
  while (node) {
    for (const attr of [...node.attributes]) {
      if (attr.value.endsWith("/")) {
        node.setAttribute(attr.name, attr.value.slice(0, -1));
        attrFixed++;
      }
    }
    node = walker.nextNode();
  }
  if (attrFixed > 0) {
    console.log(`[prerender] repaired ${attrFixed} attrs with trailing '/' (XHTML self-close artifact)`);
  }

  // Serialize
  let out = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;

  // Strip the prerender-time origin baked in by the bundle's `new URL(..., document.baseURI)`
  // calls. We strip to an empty string (not `/landing/`) so the resulting paths are
  // document-relative. Vite's HTML transform re-prepends the configured base to absolute
  // paths starting with `/`, which would otherwise double the prefix to `/landing/landing/…`
  // for asset URLs that React renders. Document-relative paths resolve correctly under both
  // the dev server and the published static site (where the document URL ends in `/landing/`).
  const beforeStrip = (out.match(/http:\/\/localhost\/landing\//g) || []).length;
  out = out.replaceAll("http://localhost/landing/", "");
  if (beforeStrip > 0) {
    console.log(`[prerender] stripped ${beforeStrip} baked-in localhost origins`);
  }

  // Defensive: any leftover prerender-host references should never escape into the artifact.
  if (/http:\/\/localhost/.test(out)) {
    throw new Error("[prerender] localhost references remain in output — refusing to write");
  }

  writeFileSync(OUT_PATH, out, "utf8");

  const sizeKb = (out.length / 1024).toFixed(1);
  console.log(`[prerender] wrote ${OUT_PATH} (${sizeKb} KB) — Grovia mentions in body: ${groviaCount}`);

  // Close the dom to release resources
  window.close();
}

main().catch((e) => {
  console.error("[prerender] FAILED:", e);
  process.exit(1);
});
