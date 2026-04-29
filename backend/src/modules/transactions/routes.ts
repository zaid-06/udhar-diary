import { Router } from "express";
import { attachAuthSession, requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { transactionsController } from "./controller.js";
import { createPaymentSchema, createTransactionSchema } from "./validation.js";

const transactionsRouter = Router();

transactionsRouter.use(attachAuthSession, requireAuth);

transactionsRouter.post("/", validate(createTransactionSchema), transactionsController.createTransaction);
transactionsRouter.post(
  "/payment",
  validate(createPaymentSchema),
  transactionsController.createPaymentTransaction,
);
transactionsRouter.get("/:partyId", transactionsController.getTransactionsByParty);

export { transactionsRouter };
