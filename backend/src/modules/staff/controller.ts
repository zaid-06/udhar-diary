import { type Request, type Response } from "express";
import { z } from "zod";
import { staffService } from "./service.js";
import { staffQuerySchema } from "./validation.js";

const getAuthUserContext = (req: Request) => {
  const authUser = req.auth?.user;
  if (!authUser?.email || !authUser?.name) return null;
  return { email: authUser.email, name: authUser.name };
};

const createStaffMember = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void res.status(401).json({ message: "Unauthorized" });
  const row = await staffService.createStaffMember(authUser, req.body);
  if (!row) return void res.status(404).json({ message: "Business not found" });
  res.status(201).json(row);
};

const getStaffByCategory = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void res.status(401).json({ message: "Unauthorized" });
  const parsed = staffQuerySchema.safeParse(req.query);
  if (!parsed.success) return void res.status(400).json({ message: "Invalid categoryId" });
  const rows = await staffService.getStaffByCategory(authUser, parsed.data.categoryId);
  if (!rows) return void res.status(404).json({ message: "Business not found" });
  res.json(rows);
};

const createSalaryLog = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void res.status(401).json({ message: "Unauthorized" });
  const staffId = z.coerce.number().int().positive().parse(req.params.id);
  const row = await staffService.createSalaryLog(authUser, staffId, req.body);
  if (!row) return void res.status(404).json({ message: "Staff not found" });
  res.status(201).json(row);
};

const getSalaryLogs = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void res.status(401).json({ message: "Unauthorized" });
  const staffId = z.coerce.number().int().positive().parse(req.params.id);
  const rows = await staffService.getSalaryLogs(authUser, staffId);
  if (!rows) return void res.status(404).json({ message: "Staff not found" });
  res.json(rows);
};

export const staffController = {
  createStaffMember,
  getStaffByCategory,
  createSalaryLog,
  getSalaryLogs,
};
