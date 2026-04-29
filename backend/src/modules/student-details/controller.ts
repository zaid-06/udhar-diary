import { type Request, type Response } from "express";
import { studentDetailsService } from "./service.js";
import { studentDetailsPartyParamsSchema } from "./validation.js";

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

const createStudentDetails = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const result = await studentDetailsService.createStudentDetails(authUser, req.body);
  if (result.status === "party_not_found") {
    res.status(404).json({ message: "Party not found" });
    return;
  }
  if (result.status === "party_not_student") {
    res.status(400).json({ message: "Student details allowed only for student party type" });
    return;
  }
  if (result.status === "already_exists") {
    res.status(409).json({ message: "Student details already exists for this party" });
    return;
  }

  res.status(201).json(result.studentDetails);
};

const getStudentDetailsByParty = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parsedParams = studentDetailsPartyParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({
      message: "Invalid partyId",
      errors: parsedParams.error.flatten().fieldErrors,
    });
    return;
  }

  const result = await studentDetailsService.getStudentDetailsByParty(authUser, parsedParams.data.partyId);
  if (result.status === "party_not_found") {
    res.status(404).json({ message: "Party not found" });
    return;
  }
  if (result.status === "party_not_student") {
    res.status(400).json({ message: "Student details allowed only for student party type" });
    return;
  }
  if (result.status === "not_found") {
    res.status(404).json({ message: "Student details not found" });
    return;
  }

  res.json(result.studentDetails);
};

const updateStudentDetailsByParty = async (req: Request, res: Response): Promise<void> => {
  const authUser = getAuthUserContext(req);
  if (!authUser) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parsedParams = studentDetailsPartyParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({
      message: "Invalid partyId",
      errors: parsedParams.error.flatten().fieldErrors,
    });
    return;
  }

  const result = await studentDetailsService.updateStudentDetailsByParty(
    authUser,
    parsedParams.data.partyId,
    req.body,
  );
  if (result.status === "party_not_found") {
    res.status(404).json({ message: "Party not found" });
    return;
  }
  if (result.status === "party_not_student") {
    res.status(400).json({ message: "Student details allowed only for student party type" });
    return;
  }
  if (result.status === "not_found") {
    res.status(404).json({ message: "Student details not found" });
    return;
  }

  res.json(result.studentDetails);
};

export const studentDetailsController = {
  createStudentDetails,
  getStudentDetailsByParty,
  updateStudentDetailsByParty,
};
