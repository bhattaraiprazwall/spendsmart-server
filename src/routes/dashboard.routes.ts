import { IRouter, Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as dashboardController from "../controllers/dashboard.controller.js";

const router: IRouter = Router();

router.use(authMiddleware);

router.get("/summary", dashboardController.summary);

export default router;