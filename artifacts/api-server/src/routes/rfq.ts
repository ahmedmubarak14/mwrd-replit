import { Router } from "express";
import {
  listRFQsForClient, listOpenRFQsForSupplier, createRFQ, getRFQ,
  listQuotesForRFQ, acceptQuoteFullBasket, acceptQuotesPerLine,
} from "@workspace/mwrd-shared";
import { requirePublicAuth } from "../middleware/auth.js";
import { qs, qn, pp } from "../lib/qs.js";

const router = Router();

router.get("/rfqs", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const filters = { status: qs(req.query.status), page: qn(req.query.page) };
    if (auth.role === "client") {
      const result = await listRFQsForClient(auth.companyId, filters);
      res.json(result);
    } else if (auth.role === "supplier") {
      const result = await listOpenRFQsForSupplier(auth.companyId, filters);
      res.json(result);
    } else {
      res.status(403).json({ error: "Forbidden" });
    }
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/rfqs", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const rfq = await createRFQ(auth.userId, req.body, "custom_request");
    res.status(201).json(rfq);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/rfqs/:id", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const rfq = await getRFQ(pp(req.params['id']), auth.userId);
    if (!rfq) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rfq);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/rfqs/:id/quotes", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const quotes = await listQuotesForRFQ(pp(req.params['id']), auth.userId);
    res.json(quotes);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/rfqs/:id/award/full-basket", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { quote_id } = req.body;
    const result = await acceptQuoteFullBasket(auth.userId, quote_id);
    res.status(201).json({ cpo: result.cpo, spo: result.spo });
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/rfqs/:id/award/per-line", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { selections } = req.body;
    const results = await acceptQuotesPerLine(auth.userId, pp(req.params['id']), selections);
    res.status(201).json(results.map((r) => ({ cpo: r.cpo, spo: r.spo })));
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

export default router;
