import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { users } from "../../db/schema.js";

type AuthUserContext = {
  name: string;
  email: string;
};

const resolveOrCreateUser = async (authUser: AuthUserContext) => {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, authUser.email))
    .limit(1);

  if (existingUser) {
    return existingUser;
  }

  const [createdUser] = await db
    .insert(users)
    .values({
      name: authUser.name,
      email: authUser.email,
    })
    .returning();

  return createdUser;
};

export const usersService = {
  resolveOrCreateUser,
};
