import { Router } from "express";
import { partiesRouter } from "../parties/routes.js";

const customersRouter = Router();
customersRouter.use("/", partiesRouter);

export { customersRouter };
