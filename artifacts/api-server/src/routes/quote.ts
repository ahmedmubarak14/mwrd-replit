import { Router } from "express";
import { listQuotesForSupplier, getQuote, editQuoteBeforeSend, sendQuoteNow } from "@workspace/mwrd-shared";
import { requirePublicAuth } from "../middleware/auth.js";
import { qs, qn, pp } from "../lib/qs.js";

const router = Router();

router.get("/quotes", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const result = await listQuotesForSupplier(auth.companyId, {
      status: qs(req.query.status),
      page: qn(req.query.page),
    });
    res.json(result);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/quotes/:id", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const quote = await getQuote(pp(req.params['id']), auth.userId);
    if (!quote) { res.status(404).json({ error: "Not found" }); return; }
    res.json(quote);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.patch("/quotes/:id", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const quote = await editQuoteBeforeSend(pp(req.params['id']), req.body, auth.userId);
    res.json(quote);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/quotes/:id/send", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const quote = await sendQuoteNow(pp(req.params['id']), auth.userId);
    res.json(quote);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

export default router;
