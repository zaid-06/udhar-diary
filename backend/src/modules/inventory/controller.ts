import { type Request, type Response } from "express";
import { z } from "zod";
import { inventoryService } from "./service.js";
import { inventoryQuerySchema, updateInventorySchema } from "./validation.js";

const getAuthUserContext = (req: Request) => {
  const authUser = req.auth?.user;
  if (!authUser?.email || !authUser?.name) return null;
  return { email: authUser.email, name: authUser.name };
};

const createInventoryItem = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void res.status(401).json({ message: "Unauthorized" });
  const row = await inventoryService.createInventoryItem(authUser, req.body);
  if (!row) return void res.status(404).json({ message: "Business not found" });
  res.status(201).json(row);
};

const getInventoryByCategory = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void res.status(401).json({ message: "Unauthorized" });
  const parsed = inventoryQuerySchema.safeParse(req.query);
  if (!parsed.success) return void res.status(400).json({ message: "Invalid categoryId" });
  const rows = await inventoryService.getInventoryByCategory(authUser, parsed.data.categoryId);
  if (!rows) return void res.status(404).json({ message: "Business not found" });
  res.json(rows);
};

const updateInventoryItem = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void res.status(401).json({ message: "Unauthorized" });
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const payload = updateInventorySchema.parse(req.body);
  const row = await inventoryService.updateInventoryItem(authUser, id, payload);
  if (!row) return void res.status(404).json({ message: "Inventory item not found" });
  res.json(row);
};

const deleteInventoryItem = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void res.status(401).json({ message: "Unauthorized" });
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const ok = await inventoryService.deleteInventoryItem(authUser, id);
  if (!ok) return void res.status(404).json({ message: "Inventory item not found" });
  res.status(204).send();
};

export const inventoryController = {
  createInventoryItem,
  getInventoryByCategory,
  updateInventoryItem,
  deleteInventoryItem,
};
