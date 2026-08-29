import { IRouter, Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createBudgetSchema,
  updateBudgetSchema,
  setBudgetCategorySchema,
  updateBudgetCategorySchema,
} from "../validators/budget.validator.js";
import * as budgetController from "../controllers/budget.controller.js";

const router: IRouter = Router();

router.use(authMiddleware);

router.get("/", budgetController.getByMonth);
router.post("/", validate(createBudgetSchema), budgetController.createOrUpdate);
router.get("/:id/status", budgetController.status);
router.put("/:id", validate(updateBudgetSchema), budgetController.update);
router.delete("/:id", budgetController.remove);
router.post(
  "/:id/categories",
  validate(setBudgetCategorySchema),
  budgetController.addCategory,
);
router.put(
  "/:id/categories/:catId",
  validate(updateBudgetCategorySchema),
  budgetController.updateCategory,
);
router.delete("/:id/categories/:catId", budgetController.removeCategory);

export default router;