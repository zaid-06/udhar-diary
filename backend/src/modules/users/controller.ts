import { type Request, type Response } from "express";
import { usersService } from "./service.js";

const getAuthUserContext = (req: Request) => {
  const authUser = req.auth?.user;
  if (!authUser?.email || !authUser?.name) {
    return null;
  }

  return {
    email: authUser.email,
    name: authUser.name,
  };
};

const getMe = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const user = await usersService.resolveOrCreateUser(authUser);
  res.json(user);
};

export const usersController = {
  getMe,
};
