import { Router } from "express";
import { attachAuthSession, requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { entitiesController } from "./controller.js";
import { createEntitySchema } from "./validation.js";

const entitiesRouter = Router();

entitiesRouter.use(attachAuthSession, requireAuth);
entitiesRouter.post("/", validate(createEntitySchema), entitiesController.createEntity);
entitiesRouter.get("/", entitiesController.getEntitiesByBusiness);
entitiesRouter.get("/:entityId", entitiesController.getEntityById);
entitiesRouter.patch("/:entityId/reminder", entitiesController.toggleEntityReminder);
entitiesRouter.patch("/:entityId", entitiesController.updateEntity);
entitiesRouter.delete("/:entityId", entitiesController.deleteEntity);

export { entitiesRouter };
