import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  businessInventory,
  businesses,
  entities,
  supplierInventoryLinks,
} from "../../db/schema.js";
import { resolveOwnerId, type AuthUserContext } from "../shared/owner.js";
import {
  type CreateBusinessInventoryInput,
  type UpdateBusinessInventoryInput,
} from "./validation.js";

const getOwnedBusiness = async (ownerId: number, businessId: string) => {
  const [business] = await db
    .select({ id: businesses.id, type: businesses.type })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, ownerId)))
    .limit(1);
  return business ?? null;
};

const createInventoryItem = async (
  authUser: AuthUserContext,
  input: CreateBusinessInventoryInput,
) => {
  const ownerId = await resolveOwnerId(authUser);
  const business = await getOwnedBusiness(ownerId, input.businessId);
  if (!business) return { status: "business_not_found" as const };
  if (business.type !== "shop")
    return { status: "unsupported_business_type" as const };

  const [created] = await db
    .insert(businessInventory)
    .values({
      businessId: input.businessId,
      productName: input.productName,
      quantity: input.quantity.toString(),
      unit: input.unit,
      purchasePrice: input.purchasePrice.toString(),
      sellingPrice: input.sellingPrice.toString(),
    })
    .returning();

  return { status: "created" as const, item: created };
};

const reduceInventory = async (
  tx: any, // baad me Drizzle transaction type laga dena
  businessId: string,
  productName: string,
  soldQuantity: number,
) => {
  // Quantity nahi hai to kuch mat karo
  if (!soldQuantity) return;

  // Product find karo
  const product = await tx.query.businessInventory.findFirst({
    where: and(
      eq(businessInventory.businessId, businessId),
      eq(businessInventory.productName, productName),
    ),
  });

  // Inventory me product nahi mila
  if (!product) {
    return;
  }

  const currentQuantity = Number(product.quantity);
  const remainingQuantity = currentQuantity - soldQuantity;

  // Stock kam hai
  if (remainingQuantity < 0) {
    throw new Error(
      `Insufficient stock. Available: ${currentQuantity} ${product.unit}`,
    );
  }

  // Inventory update
  await tx
    .update(businessInventory)
    .set({
      quantity: remainingQuantity.toString(),
    })
    .where(eq(businessInventory.id, product.id));
};

export { reduceInventory };

const getByBusiness = async (authUser: AuthUserContext, businessId: string) => {
  const ownerId = await resolveOwnerId(authUser);
  const business = await getOwnedBusiness(ownerId, businessId);
  if (!business) return null;

  return db
    .select({
      id: businessInventory.id,
      businessId: businessInventory.businessId,
      productName: businessInventory.productName,
      quantity: sql<number>`${businessInventory.quantity}::float8`,
      unit: businessInventory.unit,
      purchasePrice: sql<number>`${businessInventory.purchasePrice}::float8`,
      sellingPrice: sql<number>`${businessInventory.sellingPrice}::float8`,
      createdAt: businessInventory.createdAt,
    })
    .from(businessInventory)
    .where(eq(businessInventory.businessId, businessId))
    .orderBy(asc(businessInventory.createdAt));
};

const updateInventoryItem = async (
  authUser: AuthUserContext,
  id: string,
  payload: UpdateBusinessInventoryInput,
) => {
  const ownerId = await resolveOwnerId(authUser);
  const [updated] = await db
    .update(businessInventory)
    .set({
      ...(payload.productName !== undefined
        ? { productName: payload.productName }
        : {}),
      ...(payload.quantity !== undefined
        ? { quantity: payload.quantity.toString() }
        : {}),
      ...(payload.unit !== undefined ? { unit: payload.unit } : {}),
      ...(payload.purchasePrice !== undefined
        ? { purchasePrice: payload.purchasePrice.toString() }
        : {}),
      ...(payload.sellingPrice !== undefined
        ? { sellingPrice: payload.sellingPrice.toString() }
        : {}),
    })
    .from(businesses)
    .where(
      and(
        eq(businessInventory.id, id),
        eq(businessInventory.businessId, businesses.id),
        eq(businesses.userId, ownerId),
      ),
    )
    .returning();
  return updated ?? null;
};

const deleteInventoryItem = async (authUser: AuthUserContext, id: string) => {
  const ownerId = await resolveOwnerId(authUser);
  const [owned] = await db
    .select({ id: businessInventory.id })
    .from(businessInventory)
    .innerJoin(businesses, eq(businesses.id, businessInventory.businessId))
    .where(and(eq(businessInventory.id, id), eq(businesses.userId, ownerId)))
    .limit(1);
  if (!owned) return false;

  const [deleted] = await db
    .delete(businessInventory)
    .where(eq(businessInventory.id, id))
    .returning({ id: businessInventory.id });

  return !!deleted;
};

const linkSupplierToInventory = async (
  authUser: AuthUserContext,
  supplierId: string,
  inventoryId: string,
) => {
  const ownerId = await resolveOwnerId(authUser);
  const [candidate] = await db
    .select({
      supplierId: entities.id,
      inventoryId: businessInventory.id,
    })
    .from(entities)
    .innerJoin(businesses, eq(businesses.id, entities.businessId))
    .innerJoin(
      businessInventory,
      eq(businessInventory.businessId, businesses.id),
    )
    .where(
      and(
        eq(entities.id, supplierId),
        eq(entities.category, "supplier"),
        eq(businessInventory.id, inventoryId),
        eq(businesses.userId, ownerId),
      ),
    )
    .limit(1);

  if (!candidate) return null;

  const [link] = await db
    .insert(supplierInventoryLinks)
    .values({
      supplierId,
      inventoryId,
    })
    .onConflictDoNothing()
    .returning();

  return link ?? { supplierId, inventoryId };
};

export const businessInventoryService = {
  createInventoryItem,
  getByBusiness,
  updateInventoryItem,
  deleteInventoryItem,
  linkSupplierToInventory,
};
