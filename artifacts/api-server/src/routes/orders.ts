import { Router } from "express";
import {
  listPOsForUser, getPO, listMyApprovalTasks, approveOrder, rejectOrder,
  getApprovalChainStatus, createDN, createGRN, generateInvoice, recordPayment,
} from "@workspace/mwrd-shared";
import { requirePublicAuth } from "../middleware/auth.js";
import { qs, pp } from "../lib/qs.js";

const router = Router();

router.get("/orders", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    let data = await listPOsForUser(auth.userId, auth.role);
    const status = qs(req.query.status);
    if (status) data = data.filter((p) => p.status === status);
    res.json(data);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/orders/pending-approval", requirePublicAuth, async (_req, res) => {
  try {
    const auth = res.locals.auth!;
    const tasks = await listMyApprovalTasks(auth.userId, "pending");
    res.json(tasks.map((t) => ({ task: t.task, order: t.po })));
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/orders/:id", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const po = await getPO(pp(req.params['id']), auth.userId);
    if (!po) { res.status(404).json({ error: "Not found" }); return; }
    res.json(po);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/orders/:id/approval-status", requirePublicAuth, async (req, res) => {
  try {
    const result = await getApprovalChainStatus(pp(req.params['id']));
    res.json(result);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/orders/:id/approve", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { task_id, note } = req.body;
    const task = await approveOrder(task_id, note ?? "", auth.userId);
    res.json(task);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/orders/:id/reject", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { task_id, note } = req.body;
    const task = await rejectOrder(task_id, note ?? "", auth.userId);
    res.json(task);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/orders/:id/delivery-note", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const dn = await createDN(auth.userId, pp(req.params['id']), req.body);
    res.status(201).json(dn);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/orders/:id/grn", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { dn_id, items, notes } = req.body;
    const grn = await createGRN(auth.userId, pp(req.params['id']), dn_id, { items, notes });
    res.status(201).json(grn);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/invoices/:id", requirePublicAuth, async (req, res) => {
  try {
    const cpo_id = qs(req.query.cpo_id) ?? pp(req.params['id']);
    const grn_id = qs(req.query.grn_id) ?? "";
    const invoice = await generateInvoice(cpo_id, grn_id);
    res.json(invoice);
  } catch (e: unknown) {
    res.status(404).json({ error: "Not found" });
  }
});

router.post("/invoices/:id/pay", requirePublicAuth, async (req, res) => {
  try {
    const invoice = await recordPayment(pp(req.params['id']));
    res.json(invoice);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

export default router;
