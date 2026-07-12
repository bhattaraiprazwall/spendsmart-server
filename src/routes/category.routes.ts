import { IRouter, Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator.js";
import * as categoryController from "../controllers/category.controller.js";

const router: IRouter = Router();

router.use(authMiddleware);

router.get("/", categoryController.getAll);
router.get("/predict", categoryController.predict);
router.post("/", validate(createCategorySchema), categoryController.create);
router.put("/:id", validate(updateCategorySchema), categoryController.update);
router.delete("/:id", categoryController.remove);

export default router;
