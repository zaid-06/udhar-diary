import { and, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { categories, parties, studentDetails, users } from "../../db/schema.js";
import { type CreateStudentDetailsInput, type UpdateStudentDetailsInput } from "./validation.js";

type AuthUserContext = {
  name: string;
  email: string;
};

const resolveOwner = async (authUser: AuthUserContext) => {
  const [existingOwner] = await db
    .select({ id: users.id })
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
    .returning({ id: users.id });

  return createdOwner.id;
};

const getOwnedParty = async (ownerId: number, partyId: number) => {
  const [party] = await db
    .select({
      id: parties.id,
      type: parties.type,
    })
    .from(parties)
    .innerJoin(categories, eq(categories.id, parties.categoryId))
    .where(and(eq(parties.id, partyId), eq(categories.userId, ownerId)))
    .limit(1);

  return party ?? null;
};

const createStudentDetails = async (authUser: AuthUserContext, input: CreateStudentDetailsInput) => {
  const ownerId = await resolveOwner(authUser);
  const ownedParty = await getOwnedParty(ownerId, input.partyId);
  if (!ownedParty) return { status: "party_not_found" as const };
  if (ownedParty.type !== "student") return { status: "party_not_student" as const };

  const [existing] = await db
    .select({ id: studentDetails.id })
    .from(studentDetails)
    .where(eq(studentDetails.partyId, input.partyId))
    .limit(1);

  if (existing) {
    return { status: "already_exists" as const };
  }

  const [created] = await db.insert(studentDetails).values(input).returning();
  return { status: "created" as const, studentDetails: created };
};

const getStudentDetailsByParty = async (authUser: AuthUserContext, partyId: number) => {
  const ownerId = await resolveOwner(authUser);
  const ownedParty = await getOwnedParty(ownerId, partyId);
  if (!ownedParty) return { status: "party_not_found" as const };
  if (ownedParty.type !== "student") return { status: "party_not_student" as const };

  const [details] = await db
    .select()
    .from(studentDetails)
    .where(eq(studentDetails.partyId, partyId))
    .limit(1);

  if (!details) return { status: "not_found" as const };

  return { status: "found" as const, studentDetails: details };
};

const updateStudentDetailsByParty = async (
  authUser: AuthUserContext,
  partyId: number,
  input: UpdateStudentDetailsInput,
) => {
  const ownerId = await resolveOwner(authUser);
  const ownedParty = await getOwnedParty(ownerId, partyId);
  if (!ownedParty) return { status: "party_not_found" as const };
  if (ownedParty.type !== "student") return { status: "party_not_student" as const };

  const [updated] = await db
    .update(studentDetails)
    .set(input)
    .where(eq(studentDetails.partyId, partyId))
    .returning();

  if (!updated) return { status: "not_found" as const };
  return { status: "updated" as const, studentDetails: updated };
};

export const studentDetailsService = {
  createStudentDetails,
  getStudentDetailsByParty,
  updateStudentDetailsByParty,
};
