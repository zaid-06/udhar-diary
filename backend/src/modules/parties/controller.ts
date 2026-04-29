import { type Request, type Response } from "express";
import { partiesService } from "./service.js";
import { getPartiesQuerySchema, togglePartyReminderParamsSchema } from "./validation.js";

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

const createParty = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const party = await partiesService.createParty(authUser, req.body);
  if (!party) {
    res.status(404).json({ message: "Category not found" });
    return;
  }

  res.status(201).json(party);
};

const getPartiesByCategory = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parsedQuery = getPartiesQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({
      message: "Invalid categoryId",
      errors: parsedQuery.error.flatten().fieldErrors,
    });
    return;
  }

  const rows = await partiesService.getPartiesByCategory(authUser, parsedQuery.data.categoryId);
  if (!rows) {
    res.status(404).json({ message: "Category not found" });
    return;
  }

  res.json(rows);
};

const toggleReminder = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parsedParams = togglePartyReminderParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({
      message: "Invalid party id",
      errors: parsedParams.error.flatten().fieldErrors,
    });
    return;
  }

  const updatedParty = await partiesService.toggleReminder(authUser, parsedParams.data.id);
  if (!updatedParty) {
    res.status(404).json({ message: "Party not found" });
    return;
  }

  res.json(updatedParty);
};

export const partiesController = {
  createParty,
  getPartiesByCategory,
  toggleReminder,
};
