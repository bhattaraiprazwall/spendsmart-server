import { Router,IRouter } from "express";
import { getSpendingAnomaly } from "../controllers/zScoreAnalytics.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";


const router:IRouter = Router();

router.get(
  "/spending-anomaly",
  authMiddleware,
  getSpendingAnomaly
);

export default router;