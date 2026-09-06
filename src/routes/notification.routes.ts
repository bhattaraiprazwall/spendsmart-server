import { IRouter, Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  sendTestNotification,
  runAnomalyJob,
} from "../controllers/notification.controller.js";
const router: IRouter = Router();

router.post(
  "/test",
  authMiddleware,
  sendTestNotification,
);
router.post(
  "/test-anomaly-job",
  authMiddleware,
  runAnomalyJob,
);

export default router;