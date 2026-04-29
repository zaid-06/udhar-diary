import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "../../db/client.js";
import { categories, users } from "../../db/schema.js";
import { type CreateCategoryInput, type UpdateCategoryInput } from "./validation.js";

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

  if (existingOwner) {
    return existingOwner.id;
  }

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

const createCategory = async (authUser: AuthUserContext, input: CreateCategoryInput) => {
  const ownerId = await resolveOwner(authUser);

  const [createdCategory] = await db
    .insert(categories)
    .values({
      userId: ownerId,
      type: input.type,
      name: input.name,
      address: input.address,
    })
    .returning();

  return createdCategory;
};

const getCategories = async (authUser: AuthUserContext) => {
  const ownerId = await resolveOwner(authUser);

  return db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, ownerId), isNull(categories.deletedAt)))
    .orderBy(asc(categories.createdAt));
};

const softDeleteCategory = async (authUser: AuthUserContext, categoryId: number) => {
  const ownerId = await resolveOwner(authUser);
  const [deletedCategory] = await db
    .update(categories)
    .set({
      deletedAt: new Date(),
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(categories.id, categoryId),
        eq(categories.userId, ownerId),
        isNull(categories.deletedAt),
      ),
    )
    .returning({
      id: categories.id,
    });

  return deletedCategory ?? null;
};

const updateCategory = async (
  authUser: AuthUserContext,
  categoryId: number,
  input: UpdateCategoryInput,
) => {
  const ownerId = await resolveOwner(authUser);
  const [updatedCategory] = await db
    .update(categories)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(categories.id, categoryId),
        eq(categories.userId, ownerId),
        isNull(categories.deletedAt),
      ),
    )
    .returning();

  return updatedCategory ?? null;
};

export const categoriesService = {
  createCategory,
  getCategories,
  softDeleteCategory,
  updateCategory,
};
