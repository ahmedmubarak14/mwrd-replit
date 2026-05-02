import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import backofficeAuthRouter from "./backoffice-auth.js";
import catalogRouter from "./catalog.js";
import offersRouter from "./offers.js";
import cartRouter from "./cart.js";
import rfqRouter from "./rfq.js";
import quoteRouter from "./quote.js";
import ordersRouter from "./orders.js";
import accountRouter from "./account.js";
import favoritesRouter from "./favorites.js";
import notificationsRouter from "./notifications.js";
import backofficeRouter from "./backoffice.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(backofficeAuthRouter);
router.use(catalogRouter);
router.use(offersRouter);
router.use(cartRouter);
router.use(rfqRouter);
router.use(quoteRouter);
router.use(ordersRouter);
router.use(accountRouter);
router.use(favoritesRouter);
router.use(notificationsRouter);
router.use(backofficeRouter);

export default router;
