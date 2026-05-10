import { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error.js";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error(err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      data: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: err.details ?? null,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: "Something went wrong",
    data: null,
  });
};
