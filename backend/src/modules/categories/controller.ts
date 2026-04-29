import { type Request, type Response } from "express";
import { categoryIdParamsSchema } from "./validation.js";
import { categoriesService } from "./service.js";

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

const createCategory = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);

  if (!authUser) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const category = await categoriesService.createCategory(authUser, req.body);
  res.status(201).json(category);
};

const getCategories = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);

  if (!authUser) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const rows = await categoriesService.getCategories(authUser);
  res.json(rows);
};

const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);

  if (!authUser) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const paramsResult = categoryIdParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    res.status(400).json({
      message: "Validation failed",
      errors: paramsResult.error.flatten().fieldErrors,
    });
    return;
  }

  const categoryId = paramsResult.data.id;
  const deleted = await categoriesService.softDeleteCategory(authUser, categoryId);

  if (!deleted) {
    res.status(404).json({ message: "Category not found" });
    return;
  }

  res.status(204).send();
};

const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);

  if (!authUser) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const paramsResult = categoryIdParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    res.status(400).json({
      message: "Validation failed",
      errors: paramsResult.error.flatten().fieldErrors,
    });
    return;
  }

  const categoryId = paramsResult.data.id;
  const updated = await categoriesService.updateCategory(authUser, categoryId, req.body);
  if (!updated) {
    res.status(404).json({ message: "Category not found" });
    return;
  }

  res.json(updated);
};

export const categoriesController = {
  createCategory,
  getCategories,
  deleteCategory,
  updateCategory,
};
