import { Router } from "express";
import * as insightsController from "../controllers/insights.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, insightsController.getInsights);

export default router;
