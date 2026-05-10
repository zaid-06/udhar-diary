import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "../../db/client.js";
import { businesses } from "../../db/schema.js";
import { resolveOwnerId, type AuthUserContext } from "../shared/owner.js";
import { type CreateBusinessInput, type UpdateBusinessInput } from "./validation.js";

const createBusiness = async (authUser: AuthUserContext, input: CreateBusinessInput) => {
  const ownerId = await resolveOwnerId(authUser);
  const [created] = await db
    .insert(businesses)
    .values({
      userId: ownerId,
      name: input.name,
      type: input.type,
      address: input.address,
    })
    .returning();

  return created;
};

const getBusinesses = async (authUser: AuthUserContext) => {
  const ownerId = await resolveOwnerId(authUser);

  return db
    .select()
    .from(businesses)
    .where(and(eq(businesses.userId, ownerId), isNull(businesses.deletedAt)))
    .orderBy(asc(businesses.createdAt));
};

const getBusinessById = async (authUser: AuthUserContext, businessId: string) => {
  const ownerId = await resolveOwnerId(authUser);
  const [row] = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, ownerId), isNull(businesses.deletedAt)))
    .limit(1);
  return row ?? null;
};

const updateBusiness = async (
  authUser: AuthUserContext,
  businessId: string,
  input: UpdateBusinessInput,
) => {
  const ownerId = await resolveOwnerId(authUser);
  const [updated] = await db
    .update(businesses)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
    })
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, ownerId), isNull(businesses.deletedAt)))
    .returning();

  return updated ?? null;
};

const softDeleteBusiness = async (authUser: AuthUserContext, businessId: string) => {
  const ownerId = await resolveOwnerId(authUser);
  const [deleted] = await db
    .update(businesses)
    .set({ deletedAt: new Date() })
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, ownerId), isNull(businesses.deletedAt)))
    .returning({ id: businesses.id });
  return deleted ?? null;
};

export const businessesService = {
  createBusiness,
  getBusinesses,
  getBusinessById,
  updateBusiness,
  softDeleteBusiness,
};
