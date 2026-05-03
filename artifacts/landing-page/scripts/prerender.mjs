#!/usr/bin/env node
import { JSDOM, VirtualConsole } from "jsdom";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const TEMPLATE_PATH = join(ROOT, "index.template.html");
const OUT_PATH = join(ROOT, "index.html");
const ASSETS_DIR = join(ROOT, "public", "assets");

function findBundle() {
  const files = readdirSync(ASSETS_DIR);
  const js = files.find((f) => /^index-.*\.js$/.test(f));
  const css = files.find((f) => /^index-.*\.css$/.test(f));
  if (!js) throw new Error("Could not find bundled JS in public/assets");
  return { js, css };
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

  // Re-add the module script tag so interactivity (lang switch, accordion, mobile menu)
  // still works on the live page. The bundle re-running is idempotent for content.
  const liveScript = document.createElement("script");
  liveScript.setAttribute("type", "module");
  liveScript.setAttribute("crossorigin", "");
  liveScript.setAttribute("src", `./assets/${bundleName}`);
  document.head.appendChild(liveScript);

  // Serialize
  let out = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;

  // Strip the prerender-time origin baked in by the bundle's `new URL(..., document.baseURI)`
  // calls. The page is served under /landing/ at runtime, so leave path-relative.
  const beforeStrip = (out.match(/http:\/\/localhost\/landing\//g) || []).length;
  out = out.replaceAll("http://localhost/landing/", "/landing/");
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
