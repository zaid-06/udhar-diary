import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { categories, inventory } from "../../db/schema.js";
import { resolveOwnerId, type AuthUserContext } from "../shared/owner.js";
import { type CreateInventoryInput, type UpdateInventoryInput } from "./validation.js";

const hasCategoryAccess = async (ownerId: number, categoryId: number) => {
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, ownerId)))
    .limit(1);
  return !!row;
};

const createInventoryItem = async (authUser: AuthUserContext, input: CreateInventoryInput) => {
  const ownerId = await resolveOwnerId(authUser);
  if (!(await hasCategoryAccess(ownerId, input.categoryId))) return null;

  const [row] = await db
    .insert(inventory)
    .values({
      categoryId: input.categoryId,
      productName: input.productName,
      quantity: String(input.quantity),
      unit: input.unit,
      purchasePrice: String(input.purchasePrice),
      sellingPrice: String(input.sellingPrice),
    })
    .returning();

  return row;
};

const getInventoryByCategory = async (authUser: AuthUserContext, categoryId: number) => {
  const ownerId = await resolveOwnerId(authUser);
  if (!(await hasCategoryAccess(ownerId, categoryId))) return null;

  return db
    .select({
      id: inventory.id,
      categoryId: inventory.categoryId,
      productName: inventory.productName,
      quantity: sql<number>`${inventory.quantity}::float8`,
      unit: inventory.unit,
      purchasePrice: sql<number>`${inventory.purchasePrice}::float8`,
      sellingPrice: sql<number>`${inventory.sellingPrice}::float8`,
      createdAt: inventory.createdAt,
      lowStock: sql<boolean>`${inventory.quantity}::float8 <= 5`,
    })
    .from(inventory)
    .where(eq(inventory.categoryId, categoryId))
    .orderBy(desc(inventory.createdAt));
};

const updateInventoryItem = async (
  authUser: AuthUserContext,
  id: number,
  payload: UpdateInventoryInput,
) => {
  const ownerId = await resolveOwnerId(authUser);
  const [existing] = await db
    .select({ id: inventory.id, categoryId: inventory.categoryId })
    .from(inventory)
    .where(eq(inventory.id, id))
    .limit(1);
  if (!existing || !(await hasCategoryAccess(ownerId, existing.categoryId))) return null;

  const [updated] = await db
    .update(inventory)
    .set({
      ...(payload.productName !== undefined ? { productName: payload.productName } : {}),
      ...(payload.quantity !== undefined ? { quantity: String(payload.quantity) } : {}),
      ...(payload.unit !== undefined ? { unit: payload.unit } : {}),
      ...(payload.purchasePrice !== undefined ? { purchasePrice: String(payload.purchasePrice) } : {}),
      ...(payload.sellingPrice !== undefined ? { sellingPrice: String(payload.sellingPrice) } : {}),
    })
    .where(eq(inventory.id, id))
    .returning();

  return updated ?? null;
};

const deleteInventoryItem = async (authUser: AuthUserContext, id: number) => {
  const ownerId = await resolveOwnerId(authUser);
  const [existing] = await db
    .select({ id: inventory.id, categoryId: inventory.categoryId })
    .from(inventory)
    .where(eq(inventory.id, id))
    .limit(1);
  if (!existing || !(await hasCategoryAccess(ownerId, existing.categoryId))) return false;

  await db.delete(inventory).where(eq(inventory.id, id));
  return true;
};

export const inventoryService = {
  createInventoryItem,
  getInventoryByCategory,
  updateInventoryItem,
  deleteInventoryItem,
};
