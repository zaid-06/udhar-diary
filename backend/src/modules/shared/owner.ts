import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { users } from "../../db/schema.js";

export type AuthUserContext = {
  name: string;
  email: string;
};

export const resolveOwnerId = async (authUser: AuthUserContext) => {
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
