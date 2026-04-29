import { Router } from "express";
import { attachAuthSession, requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { suppliersController } from "./controller.js";
import { createSupplierSchema, createSupplierTransactionSchema } from "./validation.js";

const suppliersRouter = Router();

suppliersRouter.use(attachAuthSession, requireAuth);
suppliersRouter.post("/", validate(createSupplierSchema), suppliersController.createSupplier);
suppliersRouter.get("/", suppliersController.getSuppliersByCategory);
suppliersRouter.post(
  "/:id/transactions",
  validate(createSupplierTransactionSchema),
  suppliersController.createSupplierTransaction,
);
suppliersRouter.get("/:id/transactions", suppliersController.getSupplierTransactions);

export { suppliersRouter };
