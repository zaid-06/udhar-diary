import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { categories, parties, transactions, users } from "../../db/schema.js";
import { type CreatePaymentInput, type CreateTransactionInput } from "./validation.js";

type AuthUserContext = {
  name: string;
  email: string;
};

const resolveOwner = async (authUser: AuthUserContext) => {
  const [existingOwner] = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.email, authUser.email))
    .limit(1);

  if (existingOwner) return existingOwner.id;

  const [createdOwner] = await db
    .insert(users)
    .values({
      name: authUser.name,
      email: authUser.email,
    })
    .returning({
      id: users.id,
    });

  return createdOwner.id;
};

const getOwnedParty = async (ownerId: number, partyId: number) => {
  const [party] = await db
    .select({
      id: parties.id,
      totalAmount: sql<number>`${parties.totalAmount}::float8`,
    })
    .from(parties)
    .innerJoin(categories, eq(categories.id, parties.categoryId))
    .where(and(eq(parties.id, partyId), eq(categories.userId, ownerId)))
    .limit(1);

  return party ?? null;
};

const createTransaction = async (authUser: AuthUserContext, input: CreateTransactionInput) => {
  const ownerId = await resolveOwner(authUser);
  const party = await getOwnedParty(ownerId, input.partyId);

  if (!party) {
    return {
      status: "party_not_found" as const,
    };
  }

  const delta = input.type === "credit" ? input.amount : -input.amount;
  const nextTotal = party.totalAmount + delta;
  if (nextTotal < 0) {
    return {
      status: "insufficient_balance" as const,
      currentTotalAmount: party.totalAmount,
    };
  }

  const createdTransaction = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(transactions)
      .values({
        partyId: input.partyId,
        type: input.type,
        title: input.title,
        amount: input.amount.toString(),
      })
      .returning();

    await tx
      .update(parties)
      .set({
        totalAmount: sql`${parties.totalAmount} + ${delta}`,
      })
      .where(eq(parties.id, input.partyId));

    return row;
  });

  return {
    status: "created" as const,
    transaction: createdTransaction,
  };
};

const createPaymentTransaction = async (authUser: AuthUserContext, input: CreatePaymentInput) => {
  return createTransaction(authUser, {
    partyId: input.partyId,
    type: "debit",
    title: "Payment received",
    amount: input.amount,
  });
};

const getTransactionsByParty = async (authUser: AuthUserContext, partyId: number) => {
  const ownerId = await resolveOwner(authUser);
  const party = await getOwnedParty(ownerId, partyId);
  if (!party) return null;

  return db
    .select({
      id: transactions.id,
      partyId: transactions.partyId,
      type: transactions.type,
      title: transactions.title,
      amount: sql<number>`${transactions.amount}::float8`,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(eq(transactions.partyId, partyId))
    .orderBy(desc(transactions.createdAt));
};

export const transactionsService = {
  createTransaction,
  createPaymentTransaction,
  getTransactionsByParty,
};
