import { Router } from "express";
import { authRouter } from "./auth/auth.routes.js";
import { healthRouter } from "./health/health.routes.js";
import { usersRouter } from "./users/routes.js";
import { businessesRouter } from "./businesses/routes.js";
import { entitiesRouter } from "./entities/routes.js";
import { transactionsRouter } from "./transactions/routes.js";
import { inventoryRouter } from "./inventory/routes.js";

const moduleRouter = Router();

moduleRouter.use("/health", healthRouter);
moduleRouter.use("/v1/auth", authRouter);
moduleRouter.use("/v1/users", usersRouter);
moduleRouter.use("/v1/businesses", businessesRouter);
moduleRouter.use("/v1/entities", entitiesRouter);
moduleRouter.use("/v1/transactions", transactionsRouter);
moduleRouter.use("/v1/inventory", inventoryRouter);

export { moduleRouter };
