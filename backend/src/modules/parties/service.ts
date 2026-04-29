import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { categories, parties, studentDetails, users } from "../../db/schema.js";
import { type CreatePartyInput } from "./validation.js";

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

const getOwnedCategory = async (ownerId: number, categoryId: number) => {
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, ownerId)))
    .limit(1);

  return category ?? null;
};

const getOwnedParty = async (ownerId: number, partyId: number) => {
  const [party] = await db
    .select({
      id: parties.id,
      reminderEnabled: parties.reminderEnabled,
    })
    .from(parties)
    .innerJoin(categories, eq(categories.id, parties.categoryId))
    .where(and(eq(parties.id, partyId), eq(categories.userId, ownerId)))
    .limit(1);

  return party ?? null;
};

const createParty = async (authUser: AuthUserContext, input: CreatePartyInput) => {
  const ownerId = await resolveOwner(authUser);
  const category = await getOwnedCategory(ownerId, input.categoryId);

  if (!category) return null;

  return db.transaction(async (tx) => {
    const [createdParty] = await tx
      .insert(parties)
      .values({
        categoryId: input.categoryId,
        name: input.name,
        mobile: input.mobile,
        type: input.type,
      })
      .returning();

    if (input.type === "student") {
      await tx.insert(studentDetails).values({
        partyId: createdParty.id,
        class: input.class!,
        rollNumber: input.rollNumber!,
      });
    }

    return createdParty;
  });
};

const getPartiesByCategory = async (authUser: AuthUserContext, categoryId: number) => {
  const ownerId = await resolveOwner(authUser);
  const category = await getOwnedCategory(ownerId, categoryId);
  if (!category) return null;

  return db
    .select({
      id: parties.id,
      categoryId: parties.categoryId,
      name: parties.name,
      mobile: parties.mobile,
      type: parties.type,
      totalAmount: sql<number>`${parties.totalAmount}::float8`,
      reminderEnabled: parties.reminderEnabled,
      createdAt: parties.createdAt,
    })
    .from(parties)
    .where(eq(parties.categoryId, categoryId))
    .orderBy(desc(parties.totalAmount));
};

const toggleReminder = async (authUser: AuthUserContext, partyId: number) => {
  const ownerId = await resolveOwner(authUser);
  const party = await getOwnedParty(ownerId, partyId);
  if (!party) return null;

  const [updatedParty] = await db
    .update(parties)
    .set({
      reminderEnabled: !party.reminderEnabled,
    })
    .where(eq(parties.id, partyId))
    .returning({
      id: parties.id,
      reminderEnabled: parties.reminderEnabled,
    });

  return updatedParty ?? null;
};

export const partiesService = {
  createParty,
  getPartiesByCategory,
  toggleReminder,
};
