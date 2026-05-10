import { type Request, type Response } from "express";
import { z } from "zod";
import { entitiesService } from "./service.js";
import { entityBusinessQuerySchema, updateEntitySchema } from "./validation.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";

const getAuthUserContext = (req: Request) => {
  const authUser = req.auth?.user;
  if (!authUser?.email || !authUser?.name) return null;
  return { email: authUser.email, name: authUser.name };
};

const createEntity = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);

  const result = await entitiesService.createEntity(authUser, req.body);
  if (result.status === "business_not_found") {
    return void sendError(res, "Business not found", 404);
  }
  if (result.status === "invalid_category_for_business_type") {
    return void sendError(res, "Invalid category for business type", 400, {
      businessType: result.businessType,
    });
  }

  sendSuccess(res, "Entity created", result.entity, 201);
};

const getEntitiesByBusiness = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);

  const parsed = entityBusinessQuerySchema.safeParse(req.query);
  if (!parsed.success) return void sendError(res, "Invalid filters", 400, parsed.error.flatten().fieldErrors);

  const rows = await entitiesService.getEntities(authUser, parsed.data);
  if (rows === null) return void sendError(res, "Business not found", 404);
  sendSuccess(res, "Entities fetched", rows);
};

const getEntityById = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);
  const entityId = z.string().uuid().parse(req.params.entityId);
  const row = await entitiesService.getEntityById(authUser, entityId);
  if (!row) return void sendError(res, "Entity not found", 404);
  sendSuccess(res, "Entity fetched", row);
};

const toggleEntityReminder = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);

  const entityId = z.string().uuid().parse(req.params.entityId);
  const updated = await entitiesService.toggleReminder(authUser, entityId);
  if (!updated) return void sendError(res, "Entity not found", 404);
  sendSuccess(res, "Entity reminder updated", updated);
};

const updateEntity = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);

  const entityId = z.string().uuid().parse(req.params.entityId);
  const payload = updateEntitySchema.parse(req.body);
  const updated = await entitiesService.updateEntity(authUser, entityId, payload);
  if (!updated) return void sendError(res, "Entity not found", 404);
  sendSuccess(res, "Entity updated", updated);
};

const deleteEntity = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);
  const entityId = z.string().uuid().parse(req.params.entityId);
  const deleted = await entitiesService.deleteEntity(authUser, entityId);
  if (!deleted) return void sendError(res, "Entity not found", 404);
  sendSuccess(res, "Entity deleted", deleted);
};

export const entitiesController = {
  createEntity,
  getEntitiesByBusiness,
  getEntityById,
  toggleEntityReminder,
  updateEntity,
  deleteEntity,
};
