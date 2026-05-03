# mwrd B2B Procurement Platform

## Overview

Full-stack B2B procurement platform (Phase 1 MVP) with mock data. Three separate React SPAs (client, supplier, backoffice) + Express 5 API server, all in a pnpm monorepo.

## Architecture

```
artifacts/
  api-server/        — Express 5 REST API, port from $PORT, path /api
  client-portal/     — Buyer SPA, port from $PORT, path /
  supplier-portal/   — Supplier SPA, port from $PORT, path /supplier/
  backoffice/        — Admin SPA, port from $PORT, path /backoffice/

lib/
  mwrd-shared/       — Shared types, mock data, business logic (ESM, emitDeclarationOnly: false)
  api-spec/          — OpenAPI 3.0.3 spec (3381 lines, 70+ endpoints)
  api-client-react/  — Generated React Query hooks + Zod schemas (Orval codegen)
```

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24
- **TypeScript**: 5.9
- **API**: Express 5 (`artifacts/api-server`)
- **Frontend**: React + Vite + Wouter + TanStack Query + shadcn/ui
- **Shared lib**: `lib/mwrd-shared` — 130 products, 80+ async mock data functions
- **Codegen**: Orval (from OpenAPI spec → React Query hooks)
- **Build**: esbuild (API server ESM bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck
- `pnpm --filter @workspace/mwrd-shared run build` — MUST run before api-server (generates dist/index.js)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate hooks from OpenAPI

## Seed Credentials

| Role     | Email                  | Password      |
|----------|------------------------|---------------|
| Client   | client@mwrd.com        | client123     |
| Supplier | supplier@mwrd.com      | supplier123   |
| Supplier | supplier2@mwrd.com     | supplier2123  |
| Admin    | admin@mwrd.com         | admin123      |

## Auth

- **Client/Supplier tokens**: `sess_pub_*` — stored in `localStorage` as `mwrd_token`
- **Backoffice tokens**: `sess_bo_*` — stored in `localStorage` as `mwrd_bo_token`
- Token sent via `Authorization: Bearer <token>` header (configured in `lib/api-client-react/src/custom-fetch.ts`)
- Both header and `mwrd_session` cookie are accepted by the API

## Portal Routes

### Landing Page (/landing/)
Public marketing site (Webflow template, mwrd-rebranded). **Statically pre-rendered** at build time — `index.html` ships with mwrd content (no runtime text replacement, no Webflow flash). The runtime bundle (`public/assets/index-*.js`) only handles interactivity (language switcher, mobile menu, accordions). The bundle is ESM with top-level `await` (i18next init); we cannot load it as `<script type="module">` from `/public` (Vite refuses to transform it) nor as a classic `<script defer>` (top-level await is a syntax error in classic scripts). Workaround: prerender writes a sibling `index-*.classic.js` that wraps the original bundle in an `(async function(){…})()` IIFE and references that as a classic deferred script. Edits to the bundle or template require running `pnpm --filter @workspace/landing-page run prerender` (also runs automatically as part of `build`). Source template lives at `index.template.html`; never edit `index.html` directly — it is regenerated.

**Prerender invariants** (regressions break logos and/or animations):
- Strip the prerender origin (`http://localhost/landing/`) to an **empty string**, not `/landing/`. Vite's HTML transform re-prepends the configured `base` to absolute paths starting with `/`, so leaving `/landing/...` in the static HTML produces doubled `/landing/landing/client-logos/...` URLs in dev (which the SPA fallback silently serves as `text/html`, breaking all images). Document-relative paths (`client-logos/zid.webp`) resolve correctly under both Vite dev and the published static host (because the document URL ends in `/landing/` — keep the trailing slash canonical).
- Strip `class="w-mod-ix"` from `<html>` before serializing. Webflow's IX2 runtime (`webflow.d688f257.*.js` from cdn.prod.website-files.com) sets that class itself once it has bound interactions; if it's already present in the static HTML, IX2 skips initialization and on-scroll/hover animations never fire.
- Inject a 1500ms safety-net inline script at the end of `<head>` that adds `w-mod-ix` to `<html>` if IX2 hasn't done so yet. The Webflow template hides every animated element (hero H1, subtitle, buttons, hero card images, ticker — all above-the-fold) with `html.w-mod-js:not(.w-mod-ix) [data-w-id="…"] { opacity:0 }`. If IX2 fails to load (slow CDN, ad-blocker, corp proxy, network hiccup), every gated element stays invisible and the page reads as a blank white screen. The fallback uses a MutationObserver to clear its timer when IX2 wins the race, so animations still play normally in the typical case.

### Client Portal (/client/)
Login, Register, Dashboard, Catalog, Cart, RFQs, RFQ Detail, Orders, Order Detail, Notifications, Account

### Supplier Portal (/supplier/)
Login, Dashboard, RFQs, RFQ Detail, Quotes, Quote Detail, Orders, Order Detail, Offers, Create Offer, Product Requests, Notifications, Account

### Backoffice (/backoffice/)
Login, Dashboard, Leads Queue, KYC Queue, Clients, Suppliers, Products, Offers Queue, Product Requests, Quotes Review, Orders, Margins, Audit Log, Settings, Internal Users

## API Routes (all under /api)

- `POST /api/auth/login` — client/supplier login
- `POST /api/auth/register` — new user registration
- `GET /api/catalog/products` — paginated product list
- `GET /api/rfqs` — list RFQs (role-filtered)
- `GET /api/quotes` — list quotes (role-filtered)
- `GET /api/orders` — list orders (role-filtered)
- `GET /api/backoffice/*` — backoffice admin endpoints (require `sess_bo_*` token)

## Important Notes

- `lib/mwrd-shared` must have `emitDeclarationOnly: false` so esbuild can bundle it
- All data is mock (in-memory) — no database
- Anonymity: client APIs never expose supplier real_name; supplier APIs never expose client real_name; backoffice sees both
- Margin % never sent to client or supplier portals

## Design System (Untitled UI dashboard look)

Brand: **Vibrant Carrot `#FF6D43` / `rgb(255,109,67)`** (hover `rgb(205,56,22)`).

All list pages (supplier portal: RFQs/Offers/Quotes/Orders/Notifications/Account; backoffice: Clients/Suppliers/Products/Margins/AuditLog/KYC/Leads/ProductRequests) follow this pattern:

- **Page header**: `text-xl font-semibold text-[rgb(16,24,40)]` + subtitle `text-sm text-[rgb(102,112,133)]`
- **Card**: `bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]`
- **Table headers**: small uppercase `text-xs uppercase tracking-wide text-[rgb(102,112,133)]`
- **Table body**: `divide-y divide-[rgb(242,244,247)]` rows, hover `bg-[rgb(249,250,251)]`
- **Status pills**: `rounded-full px-2 py-0.5 text-xs font-medium border` with semantic soft colors (green/red/blue/amber/gray/purple), with a fallback gray for unknown statuses
- **Brand CTA**: `bg-[rgb(255,109,67)] text-white hover:bg-[rgb(205,56,22)]`
- **Tabs (AccountPage)**: WAI-ARIA `role="tablist"`/`role="tab"`/`aria-selected` + arrow-key navigation
- **Dates**: always render via `safeFormat` / `safeFromNow` / `safeLocaleDate` helpers in each portal's `src/lib/utils.ts` (returns `"—"` for null/invalid timestamps; never throws)
- Icons come from `@untitledui/icons` (the only Untitled UI package installed); other primitives are custom Tailwind, not shadcn `Button`/`Table`

## Pre-launch Checklist

Run before each `suggest_deploy`:

1. **Landing page** (`/landing/`): `curl -s http://localhost:80/landing/ | grep -ciE 'grovia|MWRD|mwrd-enhanced|http://localhost|replit\.dev'` should print `0`. View-source must show "Procure for your business" hero copy and lowercase `mwrd` brand directly in HTML. Title tag must read `mwrd — AI-powered procurement…`.
2. **Auth round-trip**: all three demo logins return a token via `POST /api/auth/login` with the credentials from the table above.
3. **Artifact paths**: `/landing/`, `/client/`, `/supplier/`, `/backoffice/`, `/api/healthz` all return 200.
4. **Cross-links**: client/supplier login pages link logo back to `/landing/`. Landing "Sign in" injection points to the correct portal.
5. **Backoffice isolation**: backoffice is reachable ONLY at `/backoffice/login` — never linked from landing/client/supplier surfaces.
