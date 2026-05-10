import { type Request, type Response } from "express";
import { entityTransactionsService } from "./service.js";
import { entityIdQuerySchema, transactionIdParamsSchema } from "./validation.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";

const getAuthUserContext = (req: Request) => {
  const authUser = req.auth?.user;
  if (!authUser?.email || !authUser?.name) return null;
  return { email: authUser.email, name: authUser.name };
};

const createTransaction = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);

  const result = await entityTransactionsService.createTransaction(authUser, req.body);
  if (result.status === "entity_not_found") {
    return void sendError(res, "Entity not found", 404);
  }
  if (result.status === "insufficient_balance") {
    return void sendError(res, "Debit amount cannot make total_amount negative", 400, {
      currentTotalAmount: result.currentTotalAmount,
    });
  }

  sendSuccess(res, "Transaction created", result.transaction, 201);
};

const getByEntity = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);

  const parsed = entityIdQuerySchema.safeParse(req.query);
  if (!parsed.success) return void sendError(res, "Invalid entityId", 400);

  const rows = await entityTransactionsService.getByEntity(authUser, parsed.data.entityId);
  if (!rows) return void sendError(res, "Entity not found", 404);
  sendSuccess(res, "Transaction history fetched", rows);
};

const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);
  const parsed = transactionIdParamsSchema.safeParse(req.params);
  if (!parsed.success) return void sendError(res, "Invalid transactionId", 400);
  const deleted = await entityTransactionsService.deleteTransaction(authUser, parsed.data.transactionId);
  if (!deleted) return void sendError(res, "Transaction not found", 404);
  sendSuccess(res, "Transaction deleted", deleted);
};

export const entityTransactionsController = {
  createTransaction,
  getByEntity,
  deleteTransaction,
};
