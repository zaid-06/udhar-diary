import { Router } from "express";
import { attachAuthSession, requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { itemsController } from "./controller.js";
import { createItemSchema } from "./validation.js";

const itemsRouter = Router();

itemsRouter.use(attachAuthSession, requireAuth);

itemsRouter.post("/", validate(createItemSchema), itemsController.createItem);
itemsRouter.get("/:partyId", itemsController.getItemsByParty);

export { itemsRouter };
