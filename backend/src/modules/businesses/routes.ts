import { Router } from "express";
import { attachAuthSession, requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { businessesController } from "./controller.js";
import { createBusinessSchema } from "./validation.js";

const businessesRouter = Router();

businessesRouter.use(attachAuthSession, requireAuth);
businessesRouter.post("/", validate(createBusinessSchema), businessesController.createBusiness);
businessesRouter.get("/", businessesController.getBusinesses);
businessesRouter.get("/:businessId", businessesController.getBusinessById);
businessesRouter.patch("/:businessId", businessesController.updateBusiness);
businessesRouter.delete("/:businessId", businessesController.softDeleteBusiness);

export { businessesRouter };
