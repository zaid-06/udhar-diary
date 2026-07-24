import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { businesses, entities, entityTransactions } from "../../db/schema.js";
import { resolveOwnerId, type AuthUserContext } from "../shared/owner.js";
import { type CreateEntityTransactionInput } from "./validation.js";
import { reduceInventory } from "../business-inventory/service.js";
const getOwnedEntity = async (ownerId: number, entityId: string) => {
  const [entity] = await db
    .select({
      id: entities.id,
      businessId: entities.businessId, // ✅ Add this
      totalAmount: sql<number>`${entities.totalAmount}::float8`,
    })
    .from(entities)
    .innerJoin(businesses, eq(businesses.id, entities.businessId))
    .where(and(eq(entities.id, entityId), eq(businesses.userId, ownerId)))
    .limit(1);

  return entity ?? null;
};

const createTransaction = async (
  authUser: AuthUserContext,
  input: CreateEntityTransactionInput,
) => {
  const ownerId = await resolveOwnerId(authUser);
  const entity = await getOwnedEntity(ownerId, input.entityId);
  if (!entity) return { status: "entity_not_found" as const };

  const delta = input.type === "credit" ? input.amount : -input.amount;
  const nextTotal = entity.totalAmount + delta;
  if (nextTotal < 0) {
    return {
      status: "insufficient_balance" as const,
      currentTotalAmount: entity.totalAmount,
    };
  }

  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(entityTransactions)
      .values({
        entityId: input.entityId,
        category: input.category,
        title: toTitleCase(input.title),
        amount: input.amount.toString(),
        quantity: input.quantity?.toString(),
        unit: input.unit,
        metadata: input.metadata,
        type: input.type,
      })
      .returning();

    await tx
      .update(entities)
      .set({
        totalAmount: sql`${entities.totalAmount} + ${delta}`,
      })
      .where(eq(entities.id, input.entityId));
    // 👇 Inventory update
    await reduceInventory(
      tx,
      entity.businessId,
      toTitleCase(input.title),
      Number(input.quantity ?? 0),
    );

    return row;
  });

  return { status: "created" as const, transaction: created };
};
function toTitleCase(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const getByEntity = async (authUser: AuthUserContext, entityId: string) => {
  const ownerId = await resolveOwnerId(authUser);
  const entity = await getOwnedEntity(ownerId, entityId);
  if (!entity) return null;

  return db
    .select({
      id: entityTransactions.id,
      entityId: entityTransactions.entityId,
      category: entityTransactions.category,
      title: entityTransactions.title,
      amount: sql<number>`${entityTransactions.amount}::float8`,
      quantity: sql<number | null>`${entityTransactions.quantity}::float8`,
      unit: entityTransactions.unit,
      metadata: entityTransactions.metadata,
      type: entityTransactions.type,
      createdAt: entityTransactions.createdAt,
    })
    .from(entityTransactions)
    .where(eq(entityTransactions.entityId, entityId))
    .orderBy(desc(entityTransactions.createdAt));
};

const deleteTransaction = async (
  authUser: AuthUserContext,
  transactionId: string,
) => {
  const ownerId = await resolveOwnerId(authUser);
  const [row] = await db
    .select({
      id: entityTransactions.id,
      entityId: entityTransactions.entityId,
      amount: sql<number>`${entityTransactions.amount}::float8`,
      type: entityTransactions.type,
    })
    .from(entityTransactions)
    .innerJoin(entities, eq(entities.id, entityTransactions.entityId))
    .innerJoin(businesses, eq(businesses.id, entities.businessId))
    .where(
      and(
        eq(entityTransactions.id, transactionId),
        eq(businesses.userId, ownerId),
      ),
    )
    .limit(1);

  if (!row) return null;

  await db.transaction(async (tx) => {
    await tx
      .delete(entityTransactions)
      .where(eq(entityTransactions.id, transactionId));
    const reverseDelta = row.type === "credit" ? -row.amount : row.amount;
    await tx
      .update(entities)
      .set({
        totalAmount: sql`${entities.totalAmount} + ${reverseDelta}`,
      })
      .where(eq(entities.id, row.entityId));
  });

  return { id: transactionId };
};

export const entityTransactionsService = {
  createTransaction,
  getByEntity,
  deleteTransaction,
};
