import { Router } from "express";
import { attachAuthSession, requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { businessInventoryController } from "./controller.js";
import { createBusinessInventorySchema } from "./validation.js";

const businessInventoryRouter = Router();

businessInventoryRouter.use(attachAuthSession, requireAuth);
businessInventoryRouter.post("/", validate(createBusinessInventorySchema), businessInventoryController.createInventoryItem);
businessInventoryRouter.get("/", businessInventoryController.getByBusiness);
businessInventoryRouter.patch("/:id", businessInventoryController.updateInventoryItem);
businessInventoryRouter.delete("/:id", businessInventoryController.deleteInventoryItem);
businessInventoryRouter.post("/supplier-link", businessInventoryController.linkSupplierToInventory);

export { businessInventoryRouter };
