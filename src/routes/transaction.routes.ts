import { IRouter, Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "../validators/transaction.validator.js";
import * as transactionController from "../controllers/transaction.controller.js";

const router: IRouter = Router();

router.use(authMiddleware);

router.post("/", validate(createTransactionSchema), transactionController.create);
router.get("/", transactionController.getAll);
router.get("/:id", transactionController.getById);
router.put("/:id", validate(updateTransactionSchema), transactionController.update);
router.delete("/:id", transactionController.remove);

export default router;
