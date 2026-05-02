import { Router } from "express";
import {
  registerPublic, signIn, signOut, getCurrentUser, activateAccount, completeOnboarding,
} from "@workspace/mwrd-shared";
import { requirePublicAuth } from "../middleware/auth.js";

const router = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { full_name, email, phone, account_type, company_name } = req.body;
    const result = await registerPublic({ full_name, email, phone, account_type, company_name });
    res.status(201).json({ user: { id: result.user.id, email: result.user.email, role: result.user.role, status: result.user.status }, message: result.message });
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await signIn(email, password);
    if (!result) { res.status(401).json({ error: "Invalid credentials" }); return; }
    const { user, sessionToken } = result;
    res.cookie("mwrd_session", sessionToken, { httpOnly: true, sameSite: "lax", maxAge: 86400000 });
    res.json({ token: sessionToken, user: { id: user.id, email: user.email, role: user.role, real_name: user.real_name, platform_alias: user.platform_alias, company_id: user.company_id, status: user.status, onboarding_completed: user.onboarding_completed } });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/auth/logout", async (req, res) => {
  const auth = req.headers["authorization"];
  const cookie = req.cookies?.["mwrd_session"];
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : cookie;
  if (token) await signOut(token);
  res.clearCookie("mwrd_session");
  res.status(204).end();
});

router.get("/auth/me", requirePublicAuth, async (req, res) => {
  try {
    const token = (req.headers["authorization"]?.slice(7) ?? req.cookies?.["mwrd_session"]) as string;
    const user = await getCurrentUser(token);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
    res.json({ id: user.id, email: user.email, role: user.role, real_name: user.real_name, platform_alias: user.platform_alias, company_id: user.company_id, status: user.status, onboarding_completed: user.onboarding_completed, language: user.language });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/auth/activate", async (req, res) => {
  try {
    const { token: activationToken, password } = req.body;
    const result = await activateAccount(activationToken, password);
    res.cookie("mwrd_session", result.sessionToken, { httpOnly: true, sameSite: "lax", maxAge: 86400000 });
    res.json({ token: result.sessionToken, user: { id: result.user.id, email: result.user.email, role: result.user.role, real_name: result.user.real_name, platform_alias: result.user.platform_alias, company_id: result.user.company_id, status: result.user.status } });
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/auth/onboarding", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    const { cr_number, vat_number, full_address, categories_served } = req.body;
    const result = await completeOnboarding(auth.userId, { cr_number, vat_number, full_address, categories_served });
    res.json({ user: { id: result.user.id, email: result.user.email, role: result.user.role, onboarding_completed: result.user.onboarding_completed }, company: { id: result.company.id, real_name: result.company.real_name, platform_alias: result.company.platform_alias } });
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

export default router;
