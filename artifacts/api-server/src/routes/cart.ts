import { Router } from "express";
import {
  getActiveCart, addToCart, updateCartItem, removeFromCart,
  addBundleToCart, saveCart, listSavedCarts, resumeSavedCart, submitCartAsRFQ,
} from "@workspace/mwrd-shared";
import { pp } from "../lib/qs.js";
import { requirePublicAuth } from "../middleware/auth.js";
import type { PackType } from "@workspace/mwrd-shared";

const router = Router();

router.get("/cart", requirePublicAuth, async (_req, res) => {
  try {
    const auth = res.locals.auth!;
    const cart = await getActiveCart(auth.userId);
    res.json(cart);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/cart/items", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { master_product_id, qty, pack_type } = req.body;
    const cart = await addToCart(auth.userId, master_product_id, qty, (pack_type ?? "Each") as PackType);
    res.json(cart);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.patch("/cart/items/:itemId", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const cart = await updateCartItem(auth.userId, pp(req.params['itemId']), req.body);
    res.json(cart);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.delete("/cart/items/:itemId", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const cart = await removeFromCart(auth.userId, pp(req.params['itemId']));
    res.json(cart);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/cart/bundle/:bundleId", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const cart = await addBundleToCart(auth.userId, pp(req.params['bundleId']));
    res.json(cart);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/cart/save", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { name } = req.body;
    const cart = await saveCart(auth.userId, name);
    res.json(cart);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/cart/saved", requirePublicAuth, async (_req, res) => {
  try {
    const auth = res.locals.auth!;
    const carts = await listSavedCarts(auth.userId);
    res.json(carts);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/cart/saved/:cartId/resume", requirePublicAuth, async (req, res) => {
  try {
    const cart = await resumeSavedCart(pp(req.params['cartId']));
    res.json(cart);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/cart/submit-rfq", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const activeCart = await getActiveCart(auth.userId);
    const rfq = await submitCartAsRFQ(activeCart.id, req.body);
    res.status(201).json(rfq);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

export default router;
