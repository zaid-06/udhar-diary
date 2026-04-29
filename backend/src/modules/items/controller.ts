import { type Request, type Response } from "express";
import { itemsService } from "./service.js";
import { itemPartyParamsSchema } from "./validation.js";

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

const createItem = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const result = await itemsService.createItem(authUser, req.body);
  if (result.status === "party_not_found") {
    res.status(404).json({ message: "Party not found" });
    return;
  }

  if (result.status === "insufficient_balance") {
    res.status(400).json({
      message: "Amount cannot make totalAmount negative",
      currentTotalAmount: result.currentTotalAmount,
    });
    return;
  }

  res.status(201).json(result.item);
};

const getItemsByParty = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parsedParams = itemPartyParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({
      message: "Invalid partyId",
      errors: parsedParams.error.flatten().fieldErrors,
    });
    return;
  }

  const rows = await itemsService.getItemsByParty(authUser, parsedParams.data.partyId);
  if (!rows) {
    res.status(404).json({ message: "Party not found" });
    return;
  }

  res.json(rows);
};

export const itemsController = {
  createItem,
  getItemsByParty,
};
