import { Router } from "express";
import { signInBackoffice, getBackofficeSession } from "@workspace/mwrd-shared";
import { requireBackofficeAuth } from "../middleware/auth.js";

const router = Router();

router.post("/backoffice/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await signInBackoffice(email, password);
    if (!result) { res.status(401).json({ error: "Invalid credentials" }); return; }
    const { user, sessionToken } = result;
    res.cookie("mwrd_bo_session", sessionToken, { httpOnly: true, sameSite: "lax", maxAge: 86400000 });
    res.json({ token: sessionToken, user: { id: user.id, email: user.email, role: user.role, real_name: user.real_name, platform_alias: user.platform_alias } });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get("/backoffice/auth/me", requireBackofficeAuth, async (req, res) => {
  try {
    const auth = req.headers["authorization"];
    const cookie = req.cookies?.["mwrd_bo_session"] ?? req.cookies?.["mwrd_session"];
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : cookie;
    const user = await getBackofficeSession(token as string);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
    res.json({ id: user.id, email: user.email, role: user.role, real_name: user.real_name, platform_alias: user.platform_alias });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/backoffice/auth/logout", requireBackofficeAuth, async (_req, res) => {
  res.clearCookie("mwrd_bo_session");
  res.clearCookie("mwrd_session");
  res.status(204).end();
});

export default router;
