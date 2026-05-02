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

function extractToken(req: Request): string | null {
  const auth = req.headers["authorization"];
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  const cookie = req.cookies?.["mwrd_session"];
  if (cookie) return cookie;
  return null;
}

export async function requirePublicAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
  const user = await getCurrentUser(token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.locals.auth = { userId: user.id, role: user.role, companyId: user.company_id };
  next();
}

export async function requireBackofficeAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
  const user = await getBackofficeSession(token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.locals.auth = { userId: user.id, role: user.role, companyId: user.company_id };
  next();
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (token) {
    const user = await getCurrentUser(token);
    if (user) res.locals.auth = { userId: user.id, role: user.role, companyId: user.company_id };
  }
  next();
}
