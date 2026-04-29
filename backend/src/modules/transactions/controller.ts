import { type Request, type Response } from "express";
import { transactionsService } from "./service.js";
import { transactionPartyParamsSchema } from "./validation.js";

const getAuthUserContext = (req: Request) => {
  const authUser = req.auth?.user;
  if (!authUser?.email || !authUser?.name) {
    return null;
  }

  return {
    email: authUser.email,
    name: authUser.name,
  };
};

const createTransaction = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const result = await transactionsService.createTransaction(authUser, req.body);

  if (result.status === "party_not_found") {
    res.status(404).json({ message: "Party not found" });
    return;
  }

  if (result.status === "insufficient_balance") {
    res.status(400).json({
      message: "Debit amount cannot make totalAmount negative",
      currentTotalAmount: result.currentTotalAmount,
    });
    return;
  }

  res.status(201).json(result.transaction);
};

const createPaymentTransaction = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const result = await transactionsService.createPaymentTransaction(authUser, req.body);

  if (result.status === "party_not_found") {
    res.status(404).json({ message: "Party not found" });
    return;
  }

  if (result.status === "insufficient_balance") {
    res.status(400).json({
      message: "Payment amount cannot exceed pending total",
      currentTotalAmount: result.currentTotalAmount,
    });
    return;
  }

  res.status(201).json(result.transaction);
};

const getTransactionsByParty = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parsedParams = transactionPartyParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({
      message: "Invalid partyId",
      errors: parsedParams.error.flatten().fieldErrors,
    });
    return;
  }

  const rows = await transactionsService.getTransactionsByParty(authUser, parsedParams.data.partyId);
  if (!rows) {
    res.status(404).json({ message: "Party not found" });
    return;
  }

  res.json(rows);
};

export const transactionsController = {
  createTransaction,
  createPaymentTransaction,
  getTransactionsByParty,
};
