import { IRouter, Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { sendTestNotification } from "../controllers/notification.controller.js";
const router: IRouter = Router();

router.post(
  "/test",
  authMiddleware,
  sendTestNotification,
);
export default router;  