import { type Request, type Response } from "express";
import { z } from "zod";
import { businessesService } from "./service.js";
import { updateBusinessSchema } from "./validation.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";

const getAuthUserContext = (req: Request) => {
  const authUser = req.auth?.user;
  if (!authUser?.email || !authUser?.name) return null;
  return { email: authUser.email, name: authUser.name };
};

const createBusiness = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);

  const created = await businessesService.createBusiness(authUser, req.body);
  sendSuccess(res, "Business created", created, 201);
};

const getBusinesses = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);

  const rows = await businessesService.getBusinesses(authUser);
  sendSuccess(res, "Businesses fetched", rows);
};

const getBusinessById = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);
  const businessId = z.string().uuid().parse(req.params.businessId);
  const row = await businessesService.getBusinessById(authUser, businessId);
  if (!row) return void sendError(res, "Business not found", 404);
  sendSuccess(res, "Business fetched", row);
};

const updateBusiness = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);

  const businessId = z.string().uuid().parse(req.params.businessId);
  const payload = updateBusinessSchema.parse(req.body);
  const updated = await businessesService.updateBusiness(authUser, businessId, payload);
  if (!updated) return void sendError(res, "Business not found", 404);
  sendSuccess(res, "Business updated", updated);
};

const softDeleteBusiness = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);
  const businessId = z.string().uuid().parse(req.params.businessId);
  const deleted = await businessesService.softDeleteBusiness(authUser, businessId);
  if (!deleted) return void sendError(res, "Business not found", 404);
  sendSuccess(res, "Business deleted", deleted);
};

export const businessesController = {
  createBusiness,
  getBusinesses,
  getBusinessById,
  updateBusiness,
  softDeleteBusiness,
};
