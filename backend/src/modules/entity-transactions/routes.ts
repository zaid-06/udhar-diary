import { Router } from "express";
import { attachAuthSession, requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { entityTransactionsController } from "./controller.js";
import { createEntityTransactionSchema } from "./validation.js";

const entityTransactionsRouter = Router();

entityTransactionsRouter.use(attachAuthSession, requireAuth);
entityTransactionsRouter.post("/", validate(createEntityTransactionSchema), entityTransactionsController.createTransaction);
entityTransactionsRouter.get("/", entityTransactionsController.getByEntity);
entityTransactionsRouter.get("/history", entityTransactionsController.getByEntity);
entityTransactionsRouter.delete("/:transactionId", entityTransactionsController.deleteTransaction);

export { entityTransactionsRouter };
