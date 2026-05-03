import { Router } from "express";
import { listNotifications, markNotificationRead, markAllNotificationsRead } from "@workspace/mwrd-shared";
import { requirePublicAuth } from "../middleware/auth.js";
import { pp } from "../lib/qs.js";

const router = Router();

router.get("/notifications", requirePublicAuth, async (_req, res) => {
  try {
    const auth = res.locals.auth!;
    const notifications = await listNotifications(auth.userId);
    res.json(notifications);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/notifications/mark-all-read", requirePublicAuth, async (_req, res) => {
  try {
    const auth = res.locals.auth!;
    const result = await markAllNotificationsRead(auth.userId);
    res.json(result);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/notifications/:id/read", requirePublicAuth, async (req, res) => {
  try {
    const auth = res.locals.auth!;
    await markNotificationRead(pp(req.params['id']), auth.userId);
    res.status(204).end();
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

export default router;
