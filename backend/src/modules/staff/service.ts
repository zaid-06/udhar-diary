import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { categories, staff, staffSalaryLogs } from "../../db/schema.js";
import { resolveOwnerId, type AuthUserContext } from "../shared/owner.js";
import { type CreateStaffInput, type CreateStaffSalaryLogInput } from "./validation.js";

const hasCategoryAccess = async (ownerId: number, categoryId: number) => {
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, ownerId)))
    .limit(1);
  return !!row;
};

const createStaffMember = async (authUser: AuthUserContext, input: CreateStaffInput) => {
  const ownerId = await resolveOwnerId(authUser);
  if (!(await hasCategoryAccess(ownerId, input.categoryId))) return null;
  const [row] = await db
    .insert(staff)
    .values({
      ...input,
      salary: String(input.salary),
    })
    .returning();
  return row;
};

const getStaffByCategory = async (authUser: AuthUserContext, categoryId: number) => {
  const ownerId = await resolveOwnerId(authUser);
  if (!(await hasCategoryAccess(ownerId, categoryId))) return null;
  return db
    .select({
      id: staff.id,
      categoryId: staff.categoryId,
      name: staff.name,
      mobile: staff.mobile,
      role: staff.role,
      salary: sql<number>`${staff.salary}::float8`,
      createdAt: staff.createdAt,
    })
    .from(staff)
    .where(eq(staff.categoryId, categoryId))
    .orderBy(desc(staff.createdAt));
};

const createSalaryLog = async (
  authUser: AuthUserContext,
  staffId: number,
  payload: CreateStaffSalaryLogInput,
) => {
  const ownerId = await resolveOwnerId(authUser);
  const [member] = await db
    .select({ id: staff.id, categoryId: staff.categoryId })
    .from(staff)
    .where(eq(staff.id, staffId))
    .limit(1);
  if (!member || !(await hasCategoryAccess(ownerId, member.categoryId))) return null;

  const [row] = await db
    .insert(staffSalaryLogs)
    .values({
      staffId,
      amount: String(payload.amount),
      date: payload.date ? new Date(payload.date) : new Date(),
    })
    .returning();
  return row;
};

const getSalaryLogs = async (authUser: AuthUserContext, staffId: number) => {
  const ownerId = await resolveOwnerId(authUser);
  const [member] = await db
    .select({ id: staff.id, categoryId: staff.categoryId })
    .from(staff)
    .where(eq(staff.id, staffId))
    .limit(1);
  if (!member || !(await hasCategoryAccess(ownerId, member.categoryId))) return null;

  return db
    .select({
      id: staffSalaryLogs.id,
      staffId: staffSalaryLogs.staffId,
      amount: sql<number>`${staffSalaryLogs.amount}::float8`,
      date: staffSalaryLogs.date,
      createdAt: staffSalaryLogs.createdAt,
    })
    .from(staffSalaryLogs)
    .where(eq(staffSalaryLogs.staffId, staffId))
    .orderBy(desc(staffSalaryLogs.date));
};

export const staffService = {
  createStaffMember,
  getStaffByCategory,
  createSalaryLog,
  getSalaryLogs,
};
