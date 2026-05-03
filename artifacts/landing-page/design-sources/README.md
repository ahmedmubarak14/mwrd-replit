# Landing page hero mockups

Standalone HTML mockups used to generate the marketing imagery on the landing page.
They render isolated dashboard/cards inspired by the actual mwrd app UIs (Inter font,
carrot orange #FF6D43, Untitled UI tokens).

## How to regenerate the JPGs

1. Temporarily copy the file you want to update into `../public/` (Vite serves it
   from `/landing/<filename>`).
2. Use the agent's `screenshot` tool with `type=app_preview`, the matching viewport,
   and `save_to=artifacts/landing-page/public/images/<target>.jpg`.
3. Move the HTML back here when done.

| Source                 | Viewport   | Saved as                       |
|------------------------|------------|--------------------------------|
| __mock_client.html     | 1200x800   | public/images/hero-card-1.jpg  |
| __mock_supplier.html   |  900x700   | public/images/hero-card-2.jpg  |
| __mock_backoffice.html | 1600x1000  | public/images/dashboard.jpg    |
