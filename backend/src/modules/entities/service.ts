import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  businesses,
  entities,
  entityMemberDetails,
  entityStaffDetails,
  entityStudentDetails,
} from "../../db/schema.js";
import { resolveOwnerId, type AuthUserContext } from "../shared/owner.js";
import { type CreateEntityInput, type UpdateEntityInput } from "./validation.js";

const allowedEntityCategories: Record<"shop" | "institute" | "gym", Set<CreateEntityInput["category"]>> = {
  shop: new Set(["customer", "supplier", "staff"]),
  institute: new Set(["student", "teacher", "staff"]),
  gym: new Set(["member", "trainer"]),
};

const getOwnedBusiness = async (ownerId: number, businessId: string) => {
  const [business] = await db
    .select({ id: businesses.id, type: businesses.type })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.userId, ownerId)))
    .limit(1);

  return business ?? null;
};

const createEntity = async (authUser: AuthUserContext, input: CreateEntityInput) => {
  const ownerId = await resolveOwnerId(authUser);
  const business = await getOwnedBusiness(ownerId, input.businessId);
  if (!business) return { status: "business_not_found" as const };

  if (!allowedEntityCategories[business.type].has(input.category)) {
    return { status: "invalid_category_for_business_type" as const, businessType: business.type };
  }

  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(entities)
      .values({
        businessId: input.businessId,
        name: input.name,
        mobile: input.mobile,
        address: input.address,
        category: input.category,
        reminderEnabled: input.reminderEnabled ?? true,
      })
      .returning();

    if (input.category === "student" && input.studentDetails) {
      await tx.insert(entityStudentDetails).values({
        entityId: row.id,
        class: input.studentDetails.class,
        rollNumber: input.studentDetails.rollNumber,
      });
    }

    if ((input.category === "staff" || input.category === "teacher" || input.category === "trainer") && input.staffDetails) {
      await tx.insert(entityStaffDetails).values({
        entityId: row.id,
        role: input.staffDetails.role,
        salary: input.staffDetails.salary.toString(),
      });
    }

    if (input.category === "member" && input.memberDetails) {
      await tx.insert(entityMemberDetails).values({
        entityId: row.id,
        membershipType: input.memberDetails.membershipType,
        joiningDate: input.memberDetails.joiningDate.toISOString().slice(0, 10),
      });
    }

    return row;
  });

  return { status: "created" as const, entity: created };
};

type EntityListFilters = {
  businessId?: string;
  category?: CreateEntityInput["category"];
  search?: string;
};

const getEntities = async (authUser: AuthUserContext, filters: EntityListFilters) => {
  const ownerId = await resolveOwnerId(authUser);
  if (!filters.businessId) return [];
  const business = await getOwnedBusiness(ownerId, filters.businessId);
  if (!business) return null;

  const whereConditions = [eq(entities.businessId, filters.businessId)];
  if (filters.category) {
    whereConditions.push(eq(entities.category, filters.category));
  }
  if (filters.search) {
    whereConditions.push(or(ilike(entities.name, `%${filters.search}%`), ilike(entities.mobile, `%${filters.search}%`))!);
  }

  return db
    .select({
      id: entities.id,
      businessId: entities.businessId,
      name: entities.name,
      mobile: entities.mobile,
      address: entities.address,
      category: entities.category,
      totalAmount: sql<number>`${entities.totalAmount}::float8`,
      reminderEnabled: entities.reminderEnabled,
      createdAt: entities.createdAt,
    })
    .from(entities)
    .where(and(...whereConditions))
    .orderBy(desc(entities.totalAmount), desc(entities.createdAt));
};

const getEntityById = async (authUser: AuthUserContext, entityId: string) => {
  const ownerId = await resolveOwnerId(authUser);
  const [row] = await db
    .select({
      id: entities.id,
      businessId: entities.businessId,
      name: entities.name,
      mobile: entities.mobile,
      address: entities.address,
      category: entities.category,
      totalAmount: sql<number>`${entities.totalAmount}::float8`,
      reminderEnabled: entities.reminderEnabled,
      createdAt: entities.createdAt,
    })
    .from(entities)
    .innerJoin(businesses, eq(businesses.id, entities.businessId))
    .where(and(eq(entities.id, entityId), eq(businesses.userId, ownerId)))
    .limit(1);
  return row ?? null;
};

const toggleReminder = async (authUser: AuthUserContext, entityId: string) => {
  const ownerId = await resolveOwnerId(authUser);
  const [ownedEntity] = await db
    .select({
      id: entities.id,
      reminderEnabled: entities.reminderEnabled,
    })
    .from(entities)
    .innerJoin(businesses, eq(businesses.id, entities.businessId))
    .where(and(eq(entities.id, entityId), eq(businesses.userId, ownerId)))
    .limit(1);

  if (!ownedEntity) return null;

  const [updated] = await db
    .update(entities)
    .set({
      reminderEnabled: !ownedEntity.reminderEnabled,
    })
    .where(eq(entities.id, entityId))
    .returning({
      id: entities.id,
      reminderEnabled: entities.reminderEnabled,
    });

  return updated ?? null;
};

const updateEntity = async (authUser: AuthUserContext, entityId: string, input: UpdateEntityInput) => {
  const ownerId = await resolveOwnerId(authUser);
  const [updated] = await db
    .update(entities)
    .set(input)
    .from(businesses)
    .where(and(eq(entities.id, entityId), eq(entities.businessId, businesses.id), eq(businesses.userId, ownerId)))
    .returning();

  return updated ?? null;
};

const deleteEntity = async (authUser: AuthUserContext, entityId: string) => {
  const ownerId = await resolveOwnerId(authUser);
  const [owned] = await db
    .select({ id: entities.id })
    .from(entities)
    .innerJoin(businesses, eq(businesses.id, entities.businessId))
    .where(and(eq(entities.id, entityId), eq(businesses.userId, ownerId)))
    .limit(1);
  if (!owned) return null;

  const [deleted] = await db
    .delete(entities)
    .where(eq(entities.id, entityId))
    .returning({ id: entities.id });
  return deleted ?? null;
};

export const entitiesService = {
  createEntity,
  getEntities,
  getEntityById,
  toggleReminder,
  updateEntity,
  deleteEntity,
};
