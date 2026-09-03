import { IRouter, Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as categoryPredictionController from "../controllers/category-prediction.controller.js";

const router: IRouter = Router();

router.use(authMiddleware);

router.post(
  "/predict-category",
  categoryPredictionController.predictCategory,
);

export default router;
