import { Router } from "express";
import { attachAuthSession, requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { partiesController } from "./controller.js";
import { createPartySchema } from "./validation.js";

const partiesRouter = Router();

partiesRouter.use(attachAuthSession, requireAuth);

partiesRouter.post("/", validate(createPartySchema), partiesController.createParty);
partiesRouter.get("/", partiesController.getPartiesByCategory);
partiesRouter.patch("/:id/reminder", partiesController.toggleReminder);

export { partiesRouter };
