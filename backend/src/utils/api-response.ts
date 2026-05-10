import { type Response } from "express";

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data: T,
  status = 200,
): Response => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  status = 400,
  data: Record<string, unknown> | null = null,
): Response => {
  return res.status(status).json({
    success: false,
    message,
    data,
  });
};

