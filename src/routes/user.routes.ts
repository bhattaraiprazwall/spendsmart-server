import { IRouter, Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as userController from "../controllers/user.controller.js";

const router: IRouter = Router();

router.use(authMiddleware);

router.get("/me", userController.getMe);
router.put("/me", userController.updateMe);
router.put("/me/settings", userController.updateSettings);
router.delete("/me", userController.deleteMe);

export default router;
