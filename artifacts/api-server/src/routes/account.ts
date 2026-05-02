import { Router } from "express";
import {
  listCompanyMembers, inviteCompanyMember, listCompanyRoles, createCompanyRole,
  listApprovalNodes, setDirectApprover, listAddresses, createAddress, updateAddress, deleteAddress,
  getDashboardStats,
} from "@workspace/mwrd-shared";
import { requirePublicAuth } from "../middleware/auth.js";
import { qs, pp } from "../lib/qs.js";

const router = Router();

router.get("/account/dashboard-stats", requirePublicAuth, async (_req, res) => {
  try {
    const auth = res.locals.auth!;
    const stats = await getDashboardStats(auth.companyId, auth.role);
    res.json(stats);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/account/members", requirePublicAuth, async (_req, res) => {
  try {
    const auth = res.locals.auth!;
    const members = await listCompanyMembers(auth.companyId);
    res.json(members);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/account/members/invite", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { email, role_id } = req.body;
    const member = await inviteCompanyMember(auth.companyId, email, role_id, auth.userId);
    res.status(201).json(member);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/account/roles", requirePublicAuth, async (_req, res) => {
  try {
    const auth = res.locals.auth!;
    const roles = await listCompanyRoles(auth.companyId);
    res.json(roles);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/account/roles", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { name, permissions } = req.body;
    const role = await createCompanyRole(auth.companyId, name, permissions ?? [], auth.userId);
    res.status(201).json(role);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/account/approval-tree", requirePublicAuth, async (_req, res) => {
  try {
    const auth = res.locals.auth!;
    const nodes = await listApprovalNodes(auth.companyId);
    res.json(nodes);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/account/approval-tree/set-approver", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { member_user_id, approver_user_id } = req.body;
    const node = await setDirectApprover(member_user_id, approver_user_id ?? null, auth.userId);
    res.json(node);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get("/account/addresses", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const type = qs(req.query.type) as "delivery" | "billing" | undefined;
    const addresses = await listAddresses(auth.companyId, type);
    res.json(addresses);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/account/addresses", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const address = await createAddress(auth.companyId, req.body, auth.userId);
    res.status(201).json(address);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.patch("/account/addresses/:id", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const address = await updateAddress(pp(req.params['id']), req.body, auth.userId);
    res.json(address);
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.delete("/account/addresses/:id", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    await deleteAddress(pp(req.params['id']), auth.userId);
    res.status(204).end();
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

export default router;
