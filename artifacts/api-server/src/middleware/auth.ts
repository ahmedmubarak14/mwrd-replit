import type { Request, Response, NextFunction } from "express";
import { getCurrentUser, getBackofficeSession } from "@workspace/mwrd-shared";

export interface AuthLocals {
  userId: string;
  role: string;
  companyId: string;
}

declare global {
  namespace Express {
    interface Locals {
      auth?: AuthLocals;
    }
  }
}

// Pull the bearer token off the Authorization header. Used by every middleware.
function extractBearer(req: Request): string | null {
  const auth = req.headers["authorization"];
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

// Public (buyer / supplier) middleware: prefer the Authorization header, fall
// back to the public session cookie set by /auth/login.
function extractPublicToken(req: Request): string | null {
  const bearer = extractBearer(req);
  if (bearer) return bearer;
  const cookie = req.cookies?.["mwrd_session"];
  if (cookie) return cookie;
  return null;
}

// Backoffice middleware: prefer the Authorization header, fall back to the
// backoffice session cookie (`mwrd_bo_session`) set by /backoffice/auth/login.
// We also accept the legacy `mwrd_session` cookie name as a transitional
// fallback so older clients aren't logged out by this fix.
function extractBackofficeToken(req: Request): string | null {
  const bearer = extractBearer(req);
  if (bearer) return bearer;
  const cookie = req.cookies?.["mwrd_bo_session"] ?? req.cookies?.["mwrd_session"];
  if (cookie) return cookie;
  return null;
}

export async function requirePublicAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractPublicToken(req);
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
  const user = await getCurrentUser(token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.locals.auth = { userId: user.id, role: user.role, companyId: user.company_id };
  next();
}

export async function requireBackofficeAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractBackofficeToken(req);
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
  const user = await getBackofficeSession(token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.locals.auth = { userId: user.id, role: user.role, companyId: user.company_id };
  next();
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractPublicToken(req);
  if (token) {
    const user = await getCurrentUser(token);
    if (user) res.locals.auth = { userId: user.id, role: user.role, companyId: user.company_id };
  }
  next();
}
