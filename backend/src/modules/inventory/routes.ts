import { Router } from "express";
import { attachAuthSession, requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { inventoryController } from "./controller.js";
import { createInventorySchema } from "./validation.js";

const inventoryRouter = Router();

inventoryRouter.use(attachAuthSession, requireAuth);
inventoryRouter.post("/", validate(createInventorySchema), inventoryController.createInventoryItem);
inventoryRouter.get("/", inventoryController.getInventoryByCategory);
inventoryRouter.patch("/:id", inventoryController.updateInventoryItem);
inventoryRouter.delete("/:id", inventoryController.deleteInventoryItem);

export { inventoryRouter };
