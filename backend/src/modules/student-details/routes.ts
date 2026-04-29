import { Router } from "express";
import { attachAuthSession, requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { studentDetailsController } from "./controller.js";
import { createStudentDetailsSchema, updateStudentDetailsSchema } from "./validation.js";

const studentDetailsRouter = Router();

studentDetailsRouter.use(attachAuthSession, requireAuth);

studentDetailsRouter.post("/", validate(createStudentDetailsSchema), studentDetailsController.createStudentDetails);
studentDetailsRouter.get("/:partyId", studentDetailsController.getStudentDetailsByParty);
studentDetailsRouter.patch(
  "/:partyId",
  validate(updateStudentDetailsSchema),
  studentDetailsController.updateStudentDetailsByParty,
);

export { studentDetailsRouter };
