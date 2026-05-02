import { Router } from "express";
import {
  getFavourites, toggleFavourite,
  listCompanyCatalogs, createCompanyCatalog, addToCompanyCatalog, removeFromCompanyCatalog,
} from "@workspace/mwrd-shared";
import { pp } from "../lib/qs.js";
import { requirePublicAuth } from "../middleware/auth.js";

const router = Router();

router.get("/favorites", requirePublicAuth, async (_req, res) => {
  try {
    const auth = res.locals.auth!;
    const fav = await getFavourites(auth.userId);
    res.json(fav);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/favorites/toggle", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { master_product_id } = req.body;
    const fav = await toggleFavourite(auth.userId, master_product_id);
    res.json(fav);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/catalogs", requirePublicAuth, async (_req, res) => {
  try {
    const auth = res.locals.auth!;
    const catalogs = await listCompanyCatalogs(auth.companyId);
    res.json(catalogs);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/catalogs", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const catalog = await createCompanyCatalog(req.body, auth.userId);
    res.status(201).json(catalog);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/catalogs/:id/items", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { master_product_id } = req.body;
    const catalog = await addToCompanyCatalog(pp(req.params['id']), master_product_id, auth.userId);
    res.json(catalog);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.delete("/catalogs/:id/items/:productId", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const catalog = await removeFromCompanyCatalog(pp(req.params['id']), pp(req.params['productId']), auth.userId);
    res.json(catalog);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

export default router;
