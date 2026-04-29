import { Router } from "express";
import { attachAuthSession, requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { staffController } from "./controller.js";
import { createStaffSalaryLogSchema, createStaffSchema } from "./validation.js";

const staffRouter = Router();

staffRouter.use(attachAuthSession, requireAuth);
staffRouter.post("/", validate(createStaffSchema), staffController.createStaffMember);
staffRouter.get("/", staffController.getStaffByCategory);
staffRouter.post("/:id/salary-logs", validate(createStaffSalaryLogSchema), staffController.createSalaryLog);
staffRouter.get("/:id/salary-logs", staffController.getSalaryLogs);

export { staffRouter };
