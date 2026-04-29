import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { categories, items, parties, users } from "../../db/schema.js";
import { transactionsService } from "../transactions/service.js";
import { type CreateItemInput } from "./validation.js";

type AuthUserContext = {
  name: string;
  email: string;
};

const getOwnedParty = async (authUser: AuthUserContext, partyId: number) => {
  const [row] = await db
    .select({
      id: parties.id,
    })
    .from(parties)
    .innerJoin(categories, eq(categories.id, parties.categoryId))
    .innerJoin(users, eq(users.id, categories.userId))
    .where(and(eq(parties.id, partyId), eq(users.email, authUser.email)))
    .limit(1);

  return row ?? null;
};

const createItem = async (authUser: AuthUserContext, input: CreateItemInput) => {
  const txResult = await transactionsService.createTransaction(authUser, {
    partyId: input.partyId,
    type: "credit",
    title: input.name,
    amount: input.amount,
  });

  if (txResult.status !== "created") {
    return txResult;
  }

  const [createdItem] = await db
    .insert(items)
    .values({
      partyId: input.partyId,
      name: input.name,
      amount: input.amount.toString(),
    })
    .returning({
      id: items.id,
      partyId: items.partyId,
      name: items.name,
      amount: sql<number>`${items.amount}::float8`,
      createdAt: items.createdAt,
    });

  return {
    status: "created" as const,
    item: {
      ...createdItem,
      itemName: createdItem.name,
    },
  };
};

const getItemsByParty = async (authUser: AuthUserContext, partyId: number) => {
  const ownedParty = await getOwnedParty(authUser, partyId);
  if (!ownedParty) {
    return null;
  }

  return db
    .select({
      id: items.id,
      partyId: items.partyId,
      name: items.name,
      itemName: items.name,
      amount: sql<number>`${items.amount}::float8`,
      createdAt: items.createdAt,
    })
    .from(items)
    .where(eq(items.partyId, partyId))
    .orderBy(desc(items.createdAt));
};

export const itemsService = {
  createItem,
  getItemsByParty,
};
