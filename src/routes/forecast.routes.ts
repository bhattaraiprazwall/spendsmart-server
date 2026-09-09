import { Router,IRouter } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getMonthlyForecast } from "../controllers/forecast.controller.js";


 const router:IRouter = Router();
router.get(
  "/monthly-forecast",
  authMiddleware,
  getMonthlyForecast,
);

export default router;