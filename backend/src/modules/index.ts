import { Router } from "express";
import { authRouter } from "./auth/auth.routes.js";
import { categoriesRouter } from "./categories/routes.js";
import { customersRouter } from "./customers/routes.js";
import { healthRouter } from "./health/health.routes.js";
import { itemsRouter } from "./items/routes.js";
import { partiesRouter } from "./parties/routes.js";
import { inventoryRouter } from "./inventory/routes.js";
import { studentDetailsRouter } from "./student-details/routes.js";
import { staffRouter } from "./staff/routes.js";
import { suppliersRouter } from "./suppliers/routes.js";
import { transactionsRouter } from "./transactions/routes.js";
import { usersRouter } from "./users/routes.js";

const moduleRouter = Router();

moduleRouter.use("/health", healthRouter);
moduleRouter.use("/v1/auth", authRouter);
moduleRouter.use("/v1/users", usersRouter);
moduleRouter.use("/v1/categories", categoriesRouter);
moduleRouter.use("/v1/customers", customersRouter);
moduleRouter.use("/v1/parties", partiesRouter);
moduleRouter.use("/v1/student-details", studentDetailsRouter);
moduleRouter.use("/v1/transactions", transactionsRouter);
moduleRouter.use("/v1/items", itemsRouter);
moduleRouter.use("/v1/inventory", inventoryRouter);
moduleRouter.use("/v1/suppliers", suppliersRouter);
moduleRouter.use("/v1/staff", staffRouter);

export { moduleRouter };
