import { Router } from "express";
import {
  listOffersForSupplier, getOffer, createOffer, updateOffer,
  listMyProductAdditionRequests, createProductAdditionRequest,
} from "@workspace/mwrd-shared";
import { requirePublicAuth } from "../middleware/auth.js";
import { qs, qn, pp } from "../lib/qs.js";

const router = Router();

router.get("/offers", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const result = await listOffersForSupplier(auth.companyId, {
      status: qs(req.query.status),
      approval_status: qs(req.query.approval_status),
      page: qn(req.query.page),
    });
    res.json(result);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/offers", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { master_product_id, ...rest } = req.body;
    const offer = await createOffer(auth.userId, master_product_id, rest);
    res.status(201).json(offer);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/offers/product-requests", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const data = await listMyProductAdditionRequests(auth.companyId);
    res.json(data);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/offers/product-requests", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const request = await createProductAdditionRequest(auth.userId, req.body);
    res.status(201).json(request);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/offers/:id", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const offer = await getOffer(pp(req.params['id']), auth.companyId);
    if (!offer) { res.status(404).json({ error: "Not found" }); return; }
    res.json(offer);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.patch("/offers/:id", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const offer = await updateOffer(pp(req.params['id']), req.body, auth.userId);
    res.json(offer);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

export default router;
