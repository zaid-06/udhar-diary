import { type Request, type Response } from "express";
import { z } from "zod";
import { businessInventoryService } from "./service.js";
import { extractInventorySlip } from "./ai.service.js";
import {
  businessInventoryQuerySchema,
  supplierInventoryLinkSchema,
  updateBusinessInventorySchema,
} from "./validation.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";

const getAuthUserContext = (req: Request) => {
  const authUser = req.auth?.user;
  if (!authUser?.email || !authUser?.name) return null;
  return { email: authUser.email, name: authUser.name };
};

const createInventoryItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);
  const result = await businessInventoryService.createInventoryItem(
    authUser,
    req.body,
  );
  if (result.status === "business_not_found")
    return void sendError(res, "Business not found", 404);
  if (result.status === "unsupported_business_type") {
    return void sendError(
      res,
      "Inventory is supported only for shop businesses",
      400,
    );
  }
  sendSuccess(res, "Inventory product created", result.item, 201);
};

const getByBusiness = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);
  const parsed = businessInventoryQuerySchema.safeParse(req.query);
  if (!parsed.success) return void sendError(res, "Invalid businessId", 400);
  const rows = await businessInventoryService.getByBusiness(
    authUser,
    parsed.data.businessId,
  );
  if (!rows) return void sendError(res, "Business not found", 404);
  sendSuccess(res, "Inventory fetched", rows);
};

const updateInventoryItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);
  const id = z.string().uuid().parse(req.params.id);
  const payload = updateBusinessInventorySchema.parse(req.body);
  const row = await businessInventoryService.updateInventoryItem(
    authUser,
    id,
    payload,
  );
  if (!row) return void sendError(res, "Inventory item not found", 404);
  sendSuccess(res, "Inventory updated", row);
};

const deleteInventoryItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);
  const id = z.string().uuid().parse(req.params.id);
  const ok = await businessInventoryService.deleteInventoryItem(authUser, id);
  if (!ok) return void sendError(res, "Inventory item not found", 404);
  sendSuccess(res, "Inventory deleted", { id });
};

const linkSupplierToInventory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) return void sendError(res, "Unauthorized", 401);
  const payload = supplierInventoryLinkSchema.parse(req.body);
  const row = await businessInventoryService.linkSupplierToInventory(
    authUser,
    payload.supplierId,
    payload.inventoryId,
  );
  if (!row)
    return void sendError(res, "Supplier or inventory item not found", 404);
  sendSuccess(res, "Supplier linked to inventory", row, 201);
};

// ai-service

const extractSlip = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check uploaded image
    if (!req.file) {
      return void sendError(res, "Image is required", 400);
    }

    // Check authentication
    const authUser = getAuthUserContext(req);
    if (!authUser) {
      return void sendError(res, "Unauthorized", 401);
    }

    // Check businessId
    const { businessId } = req.body;

    if (!businessId) {
      return void sendError(res, "Business ID is required", 400);
    }

    // Call AI Service
    const aiResponse = await extractInventorySlip(req.file);

    // Save extracted products into inventory
    const result = await businessInventoryService.bulkCreateInventoryItems(
      authUser,
      businessId,
      aiResponse.text.items,
    );

    if (result.status === "business_not_found") {
      return void sendError(res, "Business not found", 404);
    }

    if (result.status === "unsupported_business_type") {
      return void sendError(
        res,
        "Inventory is supported only for shop businesses",
        400,
      );
    }

    return void sendSuccess(
      res,
      "Slip extracted and inventory updated successfully",
      {
        purchaseDate: aiResponse.text.purchase_date,
        inventory: result.items,
      },
    );
  } catch (error) {
    console.error(error);

    return void sendError(res, "Failed to extract slip", 500);
  }
};
// const extractSlip = async (req: Request, res: Response) => {
//   if (!req.file) {
//     return sendError(res, "Image is required", 400);
//   }

//   // const data = await extractInventorySlip(req.file);
//   const aiResponse = await extractInventorySlip(req.file);

//   const authUser = getAuthUserContext(req);
//   if (!authUser) return void sendError(res, "Unauthorized", 401);

//   await businessInventoryService.bulkCreateInventoryItems(
//       authUser,
//       req.body.businessId,
//       aiResponse.text.items
//   );

//   sendSuccess(res, "Slip extracted successfully", aiResponse);
// };

export const businessInventoryController = {
  createInventoryItem,
  getByBusiness,
  updateInventoryItem,
  deleteInventoryItem,
  linkSupplierToInventory,
  extractSlip,
};
