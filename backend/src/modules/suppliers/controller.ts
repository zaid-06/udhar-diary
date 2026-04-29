import { type Request, type Response } from "express";
import { z } from "zod";
import { suppliersService } from "./service.js";
import { suppliersQuerySchema } from "./validation.js";

const getAuthUserContext = (req: Request) => {
  const authUser = req.auth?.user;
  if (!authUser?.email || !authUser?.name) return null;
  return { email: authUser.email, name: authUser.name };
};

const createSupplier = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void res.status(401).json({ message: "Unauthorized" });
  const row = await suppliersService.createSupplier(authUser, req.body);
  if (!row) return void res.status(404).json({ message: "Business not found" });
  res.status(201).json(row);
};

const getSuppliersByCategory = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void res.status(401).json({ message: "Unauthorized" });
  const parsed = suppliersQuerySchema.safeParse(req.query);
  if (!parsed.success) return void res.status(400).json({ message: "Invalid categoryId" });
  const rows = await suppliersService.getSuppliersByCategory(authUser, parsed.data.categoryId);
  if (!rows) return void res.status(404).json({ message: "Business not found" });
  res.json(rows);
};

const createSupplierTransaction = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void res.status(401).json({ message: "Unauthorized" });
  const supplierId = z.coerce.number().int().positive().parse(req.params.id);
  const row = await suppliersService.createSupplierTransaction(authUser, supplierId, req.body);
  if (!row) return void res.status(404).json({ message: "Supplier not found" });
  res.status(201).json(row);
};

const getSupplierTransactions = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void res.status(401).json({ message: "Unauthorized" });
  const supplierId = z.coerce.number().int().positive().parse(req.params.id);
  const rows = await suppliersService.getSupplierTransactions(authUser, supplierId);
  if (!rows) return void res.status(404).json({ message: "Supplier not found" });
  res.json(rows);
};

export const suppliersController = {
  createSupplier,
  getSuppliersByCategory,
  createSupplierTransaction,
  getSupplierTransactions,
};
