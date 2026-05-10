import { type NextFunction, type Request, type Response } from "express";
import { type ZodSchema } from "zod";
import { sendError } from "../utils/api-response.js";

export const validate =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      sendError(res, "Validation failed", 400, result.error.flatten().fieldErrors);
      return;
    }

    req.body = result.data;
    next();
  };
