#!/usr/bin/env node
// Local dev orchestrator for the mwrd monorepo.
// Spawns api-server + the three portals + landing page, then puts a tiny
// path-prefix reverse proxy in front of them on port 8080 so the topology
// matches production (single host, paths /, /client/, /supplier/, /backoffice/, /api).
//
// Usage: node scripts/dev-local.mjs   (or: pnpm run dev:local)

import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import { URL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const EDGE_PORT = Number(process.env.EDGE_PORT ?? 8080);

// Each entry: prefix -> { port, name, cwd, env, prefixStrip }
// prefixStrip=false keeps the original path (Vite needs `/client/...` because
// BASE_PATH=/client/). The api-server already mounts under /api so we keep
// that prefix too.
const services = [
  {
    name: "api-server",
    prefix: "/api",
    port: 3001,
    cwd: path.join(repoRoot, "artifacts/api-server"),
    cmd: "pnpm",
    args: ["run", "dev"],
    env: { PORT: "3001" },
    readiness: "Server listening",
  },
  {
    name: "landing",
    prefix: "/",
    port: 3005,
    cwd: path.join(repoRoot, "artifacts/landing-page"),
    cmd: "pnpm",
    args: ["run", "dev"],
    env: { PORT: "3005", BASE_PATH: "/" },
  },
  {
    name: "client-portal",
    prefix: "/client",
    port: 3002,
    cwd: path.join(repoRoot, "artifacts/client-portal"),
    cmd: "pnpm",
    args: ["run", "dev"],
    env: { PORT: "3002", BASE_PATH: "/client/" },
  },
  {
    name: "supplier-portal",
    prefix: "/supplier",
    port: 3003,
    cwd: path.join(repoRoot, "artifacts/supplier-portal"),
    cmd: "pnpm",
    args: ["run", "dev"],
    env: { PORT: "3003", BASE_PATH: "/supplier/" },
  },
  {
    name: "backoffice",
    prefix: "/backoffice",
    port: 3004,
    cwd: path.join(repoRoot, "artifacts/backoffice"),
    cmd: "pnpm",
    args: ["run", "dev"],
    env: { PORT: "3004", BASE_PATH: "/backoffice/" },
  },
];

const children = [];

function color(label) {
  // Stable color per service so multiplexed logs are readable.
  const colors = ["\x1b[36m", "\x1b[33m", "\x1b[35m", "\x1b[32m", "\x1b[34m"];
  const idx = services.findIndex((s) => s.name === label) % colors.length;
  return `${colors[idx]}[${label}]\x1b[0m`;
}

function spawnService(svc) {
  const child = spawn(svc.cmd, svc.args, {
    cwd: svc.cwd,
    env: { ...process.env, ...svc.env },
    stdio: ["ignore", "pipe", "pipe"],
    // Detach into a new process group so a kill below reaches the real
    // Vite/Node process, not just the pnpm/npm wrapper that swallows SIGTERM.
    detached: true,
  });
  children.push(child);

  const tag = color(svc.name);
  const prefix = (line) => `${tag} ${line}`;

  child.stdout.on("data", (buf) => {
    for (const line of buf.toString().split("\n")) {
      if (line.trim()) console.log(prefix(line));
    }
  });
  child.stderr.on("data", (buf) => {
    for (const line of buf.toString().split("\n")) {
      if (line.trim()) console.error(prefix(line));
    }
  });
  child.on("exit", (code) => {
    console.log(prefix(`exited with code ${code}`));
    shutdown(code ?? 0);
  });
}

// Resolve which upstream service should handle a request based on path prefix.
// Order matters: more specific (/api, /client, /supplier, /backoffice) before /.
function pickUpstream(reqPath) {
  // Exact-prefix match: "/client", "/client/", "/client/anything"
  for (const svc of services) {
    if (svc.prefix === "/") continue;
    if (reqPath === svc.prefix || reqPath.startsWith(svc.prefix + "/")) return svc;
  }
  return services.find((s) => s.prefix === "/");
}

function startEdge() {
  const server = http.createServer((req, res) => {
    const upstream = pickUpstream(req.url || "/");
    if (!upstream) {
      res.writeHead(502).end("No upstream");
      return;
    }
    const proxyReq = http.request(
      {
        host: "127.0.0.1",
        port: upstream.port,
        method: req.method,
        path: req.url,
        headers: { ...req.headers, host: `127.0.0.1:${upstream.port}` },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );
    proxyReq.on("error", (err) => {
      console.error(`[edge] ${upstream.name} proxy error: ${err.message}`);
      if (!res.headersSent) res.writeHead(502).end(`Upstream ${upstream.name} unavailable`);
    });
    req.pipe(proxyReq);
  });

  // WebSocket passthrough for Vite HMR.
  server.on("upgrade", (req, clientSocket, head) => {
    const upstream = pickUpstream(req.url || "/");
    if (!upstream) return clientSocket.destroy();
    const upstreamSocket = net.connect(upstream.port, "127.0.0.1", () => {
      const headerLines = [
        `${req.method} ${req.url} HTTP/${req.httpVersion}`,
        ...Object.entries(req.headers).map(
          ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`,
        ),
        "",
        "",
      ].join("\r\n");
      upstreamSocket.write(headerLines);
      if (head && head.length) upstreamSocket.write(head);
      upstreamSocket.pipe(clientSocket);
      clientSocket.pipe(upstreamSocket);
    });
    upstreamSocket.on("error", () => clientSocket.destroy());
    clientSocket.on("error", () => upstreamSocket.destroy());
  });

  server.listen(EDGE_PORT, () => {
    console.log("");
    console.log(`\x1b[1m\x1b[32m  → mwrd local edge ready at http://localhost:${EDGE_PORT}\x1b[0m`);
    console.log("    /                  landing");
    console.log("    /client/login      client portal");
    console.log("    /supplier/login    supplier portal");
    console.log("    /backoffice/login  backoffice");
    console.log("    /api/healthz       api server");
    console.log("");
    console.log("  Demo logins (per replit.md):");
    console.log("    client@mwrd.com    / client123");
    console.log("    supplier@mwrd.com  / supplier123");
    console.log("    admin@mwrd.com     / admin123     (backoffice)");
    console.log("");
  });
}

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("\n[edge] shutting down…");
  for (const child of children) {
    if (child.killed || child.pid == null) continue;
    // Negative pid kills the whole process group, taking the pnpm wrapper
    // AND its grandchild (vite/node) with it.
    try { process.kill(-child.pid, "SIGTERM"); } catch {}
  }
  setTimeout(() => {
    for (const child of children) {
      if (child.pid == null) continue;
      try { process.kill(-child.pid, "SIGKILL"); } catch {}
    }
    process.exit(code);
  }, 1500);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("[edge] starting services…");
for (const svc of services) spawnService(svc);

// Give the upstream services a few seconds to bind their ports before we
// announce the edge — avoids early ECONNREFUSED noise on the first request.
setTimeout(startEdge, 2000);
