import { Router } from "express";
import {
  listPOsForUser, getPO, listMyApprovalTasks, approveOrder, rejectOrder,
  getApprovalChainStatus, createDN, createGRN, generateInvoice, recordPayment,
  getCompany, getUser,
} from "@workspace/mwrd-shared";
import { requirePublicAuth } from "../middleware/auth.js";
import { qs, pp } from "../lib/qs.js";
import { createWafeqInvoice } from "../lib/wafeq.js";

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
    const auth = res.locals.auth!;
    const cpo_id = qs(req.query.cpo_id) ?? pp(req.params['id']);
    const grn_id = qs(req.query.grn_id) ?? "";

    const po = await getPO(cpo_id, auth.userId);
    if (!po) { res.status(404).json({ error: "Order not found" }); return; }

    let wafeqData: { wafeq_invoice_id?: string | null; wafeq_pdf_url?: string | null } | undefined;

    if (process.env['WAFEQ_API_KEY']) {
      try {
        const [clientCompany, clientUser] = await Promise.all([
          getCompany(po.client_company_id),
          getUser(auth.userId),
        ]);

        const lineItems = po.items.map((item) => ({
          name: item.name_en,
          description: item.name_en,
          quantity: item.qty,
          price: item.unit_price_sar,
        }));

        const invoiceNumber = `mwrd-${po.po_number}`;

        const wafeqResult = await createWafeqInvoice({
          invoiceNumber,
          invoiceDate: new Date().toISOString().split('T')[0]!,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
          contact: {
            name: clientCompany?.real_name ?? 'mwrd Client',
            email: clientUser?.email,
            address: clientCompany?.vat_number ? `VAT: ${clientCompany.vat_number}` : undefined,
          },
          lineItems,
          currency: 'SAR',
        });

        wafeqData = {
          wafeq_invoice_id: wafeqResult.id,
          wafeq_pdf_url: wafeqResult.pdf_url ?? null,
        };

        req.log.info({ wafeq_invoice_id: wafeqResult.id }, 'Wafeq invoice created');
      } catch (wafeqErr: unknown) {
        req.log.warn({ err: (wafeqErr as Error).message }, 'Wafeq invoice creation failed — proceeding without it');
        wafeqData = { wafeq_invoice_id: `wafeq-error-${Date.now()}`, wafeq_pdf_url: null };
      }
    }

    const invoice = await generateInvoice(cpo_id, grn_id, wafeqData);
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
