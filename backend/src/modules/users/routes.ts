import { Router } from "express";
import { attachAuthSession, requireAuth } from "../../middlewares/auth.middleware.js";
import { usersController } from "./controller.js";

const usersRouter = Router();

usersRouter.use(attachAuthSession, requireAuth);

usersRouter.get("/me", usersController.getMe);

export { usersRouter };
