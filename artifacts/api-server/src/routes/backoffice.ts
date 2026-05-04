import { Router } from "express";
import {
  listAllUsers, suspendUser, reactivateUser,
  markCallbackComplete, approveKYC, rejectKYC,
  listLeadsQueue, listKycQueue,
  listMasterProducts, createMasterProduct, updateMasterProduct, deprecateMasterProduct,
  countActiveOffersByProduct,
  createCategory, updateCategory, deleteCategory,
  listPendingOffers, approveOffer, rejectOffer,
  listAllProductAdditionRequests, approveProductAdditionRequest, rejectProductAdditionRequest,
  listAdminHeldQuotes, listPendingAutoQuotes, approveAdminHeldQuote,
  listMargins, setMargin,
  listAuditLog,
  getPlatformSettings, updatePlatformSettings,
  inviteInternalUser, adminCreateAccount, getBackofficeUserDetail,
  listPOsForUser,
  getDashboardStats,
  listThreeWayMatchQueue,
  issueInvoiceForCpo,
} from "@workspace/mwrd-shared";
import { requireBackofficeAuth } from "../middleware/auth.js";
import { qs, qn, pp } from "../lib/qs.js";

const router = Router();

router.get("/backoffice/dashboard-stats", requireBackofficeAuth, async (_req, res) => {
  try {
    const auth = res.locals.auth!;
    const stats = await getDashboardStats(auth.companyId, "admin");
    res.json(stats);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/backoffice/leads", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const result = await listLeadsQueue({ account_type: qs(req.query.account_type), page: qn(req.query.page) }, auth.userId);
    res.json(result);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/backoffice/leads/:id/callback-complete", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { notes } = req.body;
    const user = await markCallbackComplete(pp(req.params['id']), notes ?? "", auth.userId);
    res.json(user);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/backoffice/kyc-queue", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const result = await listKycQueue({ page: qn(req.query.page) }, auth.userId);
    res.json(result);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/backoffice/kyc/:id/approve", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const user = await approveKYC(pp(req.params['id']), auth.userId);
    res.json(user);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/backoffice/kyc/:id/reject", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { reason } = req.body;
    const user = await rejectKYC(pp(req.params['id']), reason ?? "", auth.userId);
    res.json(user);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/backoffice/clients", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const result = await listAllUsers({ role: "client", status: qs(req.query.status), page: qn(req.query.page) }, auth.userId);
    res.json(result);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/backoffice/suppliers", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const result = await listAllUsers({ role: "supplier", status: qs(req.query.status), page: qn(req.query.page) }, auth.userId);
    res.json(result);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/backoffice/internal-users", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const result = await listAllUsers({ role: "admin" }, auth.userId);
    res.json(result.data);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/backoffice/internal-users/invite", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { email, name, role } = req.body;
    const user = await inviteInternalUser(email, name, role, auth.userId);
    res.status(201).json(user);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/backoffice/users/:id/detail", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const detail = await getBackofficeUserDetail(pp(req.params['id']), auth.userId);
    if (!detail) { res.status(404).json({ error: "User not found" }); return; }
    res.json(detail);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/backoffice/users/create", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const result = await adminCreateAccount(req.body, auth.userId);
    res.status(201).json(result);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/backoffice/users/:id/suspend", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const user = await suspendUser(pp(req.params['id']), auth.userId);
    res.json(user);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/backoffice/users/:id/reactivate", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const user = await reactivateUser(pp(req.params['id']), auth.userId);
    res.json(user);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/backoffice/products", requireBackofficeAuth, async (req, res) => {
  try {
    const result = await listMasterProducts({
      category_id: qs(req.query.category_id),
      search: qs(req.query.search),
      page: qn(req.query.page),
      status: qs(req.query.status) as "active" | "deprecated" | undefined,
    });
    const counts = await countActiveOffersByProduct(result.data.map((p) => p.id));
    const data = result.data.map((p) => ({ ...p, active_offers_count: counts[p.id] ?? 0 }));
    res.json({ data, total: result.total });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/backoffice/products", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const product = await createMasterProduct(auth.userId, req.body);
    res.status(201).json(product);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.patch("/backoffice/products/:id", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const product = await updateMasterProduct(pp(req.params['id']), req.body, auth.userId);
    res.json(product);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.delete("/backoffice/products/:id", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const product = await deprecateMasterProduct(pp(req.params['id']), auth.userId);
    res.json(product);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/backoffice/categories", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const cat = await createCategory(req.body, auth.userId);
    res.status(201).json(cat);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.patch("/backoffice/categories/:id", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const cat = await updateCategory(pp(req.params['id']), req.body, auth.userId);
    res.json(cat);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.delete("/backoffice/categories/:id", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    await deleteCategory(pp(req.params['id']), auth.userId);
    res.status(204).end();
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/backoffice/offers/pending", requireBackofficeAuth, async (_req, res) => {
  try {
    const auth = res.locals.auth!;
    const offers = await listPendingOffers(auth.userId);
    res.json(offers);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/backoffice/offers/:id/approve", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const offer = await approveOffer(pp(req.params['id']), auth.userId);
    res.json(offer);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/backoffice/offers/:id/reject", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { reason } = req.body;
    const offer = await rejectOffer(pp(req.params['id']), reason ?? "", auth.userId);
    res.json(offer);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/backoffice/product-requests", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const result = await listAllProductAdditionRequests({ status: qs(req.query.status), page: qn(req.query.page) }, auth.userId);
    res.json(result);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/backoffice/product-requests/:id/approve", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const result = await approveProductAdditionRequest(pp(req.params['id']), req.body, auth.userId);
    res.json(result);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/backoffice/product-requests/:id/reject", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { reason } = req.body;
    const request = await rejectProductAdditionRequest(pp(req.params['id']), reason ?? "", auth.userId);
    res.json(request);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/backoffice/quotes/held", requireBackofficeAuth, async (_req, res) => {
  try {
    const auth = res.locals.auth!;
    const quotes = await listAdminHeldQuotes(auth.userId);
    res.json(quotes);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/backoffice/quotes/pending-auto", requireBackofficeAuth, async (_req, res) => {
  try {
    const auth = res.locals.auth!;
    const quotes = await listPendingAutoQuotes(auth.userId);
    res.json(quotes);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/backoffice/quotes/:id/approve", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { final_margin_pct } = req.body;
    const quote = await approveAdminHeldQuote(pp(req.params['id']), final_margin_pct ?? 15, auth.userId);
    res.json(quote);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/backoffice/margins", requireBackofficeAuth, async (_req, res) => {
  try {
    const margins = await listMargins();
    res.json(margins);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/backoffice/margins", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { scope, scope_id, pct } = req.body;
    const margin = await setMargin(scope, scope_id ?? null, pct, auth.userId);
    res.json(margin);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/backoffice/audit-log", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const logs = await listAuditLog({ actor_user_id: qs(req.query.actor_user_id), entity_type: qs(req.query.entity_type), page: qn(req.query.page) }, auth.userId);
    res.json(logs);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/backoffice/settings", requireBackofficeAuth, async (_req, res) => {
  try {
    const settings = await getPlatformSettings();
    res.json(settings);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.patch("/backoffice/settings", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const settings = await updatePlatformSettings(req.body, auth.userId);
    res.json(settings);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/backoffice/orders", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const allPos = await listPOsForUser(auth.userId, "admin");
    const status = qs(req.query.status);
    const filtered = status ? allPos.filter((p) => p.status === status) : allPos;
    res.json(filtered);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/backoffice/three-way-match", requireBackofficeAuth, async (_req, res) => {
  try {
    const auth = res.locals.auth!;
    const rows = await listThreeWayMatchQueue(auth.userId);
    res.json(rows);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/backoffice/three-way-match/:cpoId/issue-invoice", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const invoice = await issueInvoiceForCpo(pp(req.params['cpoId']), auth.userId);
    res.status(201).json(invoice);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

export default router;
