import { type Request, type Response } from "express";
import { usersService } from "./service.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";

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
    sendError(res, "Unauthorized", 401);
    return;
  }

  const user = await usersService.resolveOrCreateUser(authUser);
  sendSuccess(res, "Current user fetched", user);
};

export const usersController = {
  getMe,
};
