import { Router } from "express";
import {
  attachAuthSession,
  requireAuth,
} from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { businessInventoryController } from "./controller.js";
import { createBusinessInventorySchema } from "./validation.js";
import { upload } from "../../middlewares/upload.js";

const businessInventoryRouter = Router();

businessInventoryRouter.use(attachAuthSession, requireAuth);
businessInventoryRouter.get(
  "/unit-types",
  businessInventoryController.getUnitTypes,
);
businessInventoryRouter.post(
  "/",
  validate(createBusinessInventorySchema),
  businessInventoryController.createInventoryItem,
);
businessInventoryRouter.get("/", businessInventoryController.getByBusiness);
businessInventoryRouter.patch(
  "/:id",
  businessInventoryController.updateInventoryItem,
);
businessInventoryRouter.delete(
  "/:id",
  businessInventoryController.deleteInventoryItem,
);
businessInventoryRouter.post(
  "/supplier-link",
  businessInventoryController.linkSupplierToInventory,
);
businessInventoryRouter.post(
  "/extract-slip",
  upload.single("file"),
  businessInventoryController.extractSlip,
);

export { businessInventoryRouter };
