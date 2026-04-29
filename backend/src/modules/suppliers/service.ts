import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { categories, suppliers, supplierTransactions } from "../../db/schema.js";
import { resolveOwnerId, type AuthUserContext } from "../shared/owner.js";
import { type CreateSupplierInput, type CreateSupplierTransactionInput } from "./validation.js";

const hasCategoryAccess = async (ownerId: number, categoryId: number) => {
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, ownerId)))
    .limit(1);
  return !!row;
};

const createSupplier = async (authUser: AuthUserContext, input: CreateSupplierInput) => {
  const ownerId = await resolveOwnerId(authUser);
  if (!(await hasCategoryAccess(ownerId, input.categoryId))) return null;
  const [row] = await db.insert(suppliers).values(input).returning();
  return row;
};

const getSuppliersByCategory = async (authUser: AuthUserContext, categoryId: number) => {
  const ownerId = await resolveOwnerId(authUser);
  if (!(await hasCategoryAccess(ownerId, categoryId))) return null;

  const rows = await db
    .select({
      id: suppliers.id,
      categoryId: suppliers.categoryId,
      name: suppliers.name,
      mobile: suppliers.mobile,
      address: suppliers.address,
      createdAt: suppliers.createdAt,
      outstandingBalance: sql<number>`coalesce(sum(case when ${supplierTransactions.type} = 'taken' then ${supplierTransactions.amount}::float8 else -${supplierTransactions.amount}::float8 end), 0)`,
    })
    .from(suppliers)
    .leftJoin(supplierTransactions, eq(supplierTransactions.supplierId, suppliers.id))
    .where(eq(suppliers.categoryId, categoryId))
    .groupBy(suppliers.id)
    .orderBy(desc(suppliers.createdAt));

  return rows;
};

const createSupplierTransaction = async (
  authUser: AuthUserContext,
  supplierId: number,
  payload: CreateSupplierTransactionInput,
) => {
  const ownerId = await resolveOwnerId(authUser);
  const [supplier] = await db
    .select({
      id: suppliers.id,
      categoryId: suppliers.categoryId,
    })
    .from(suppliers)
    .where(eq(suppliers.id, supplierId))
    .limit(1);
  if (!supplier || !(await hasCategoryAccess(ownerId, supplier.categoryId))) return null;

  const [row] = await db
    .insert(supplierTransactions)
    .values({
      supplierId,
      amount: String(payload.amount),
      type: payload.type,
    })
    .returning();
  return row;
};

const getSupplierTransactions = async (authUser: AuthUserContext, supplierId: number) => {
  const ownerId = await resolveOwnerId(authUser);
  const [supplier] = await db
    .select({ id: suppliers.id, categoryId: suppliers.categoryId })
    .from(suppliers)
    .where(eq(suppliers.id, supplierId))
    .limit(1);
  if (!supplier || !(await hasCategoryAccess(ownerId, supplier.categoryId))) return null;
  return db
    .select({
      id: supplierTransactions.id,
      supplierId: supplierTransactions.supplierId,
      amount: sql<number>`${supplierTransactions.amount}::float8`,
      type: supplierTransactions.type,
      createdAt: supplierTransactions.createdAt,
    })
    .from(supplierTransactions)
    .where(eq(supplierTransactions.supplierId, supplierId))
    .orderBy(desc(supplierTransactions.createdAt));
};

export const suppliersService = {
  createSupplier,
  getSuppliersByCategory,
  createSupplierTransaction,
  getSupplierTransactions,
};
