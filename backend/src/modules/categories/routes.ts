import { Router } from "express";
import { attachAuthSession, requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { categoriesController } from "./controller.js";
import { createCategorySchema, updateCategorySchema } from "./validation.js";

const categoriesRouter = Router();

categoriesRouter.use(attachAuthSession, requireAuth);

categoriesRouter.post("/", validate(createCategorySchema), categoriesController.createCategory);
categoriesRouter.get("/", categoriesController.getCategories);
categoriesRouter.patch("/:id", validate(updateCategorySchema), categoriesController.updateCategory);
categoriesRouter.delete("/:id", categoriesController.deleteCategory);

export { categoriesRouter };
