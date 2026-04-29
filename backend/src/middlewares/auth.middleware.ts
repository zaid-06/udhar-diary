import { type NextFunction, type Request as ExpressRequest, type Response } from "express";
import { auth } from "../auth/auth.config.js";
import { env } from "../utils/env.js";

const getForwardHeaders = (req: ExpressRequest): Headers => {
  const headers = new Headers();

  if (req.headers.cookie) {
    headers.set("cookie", req.headers.cookie);
  }

  const origin = req.headers.origin || env.BETTER_AUTH_URL;
  headers.set("origin", origin);
  headers.set("referer", origin);

  const authorization = req.headers.authorization;
  if (authorization) {
    headers.set("authorization", authorization);
  }

  if (req.headers["user-agent"]) {
    headers.set("user-agent", String(req.headers["user-agent"]));
  }

  if (req.ip) {
    headers.set("x-forwarded-for", req.ip);
  }

  return headers;
};

const createAuthRequest = (req: ExpressRequest): globalThis.Request =>
  new globalThis.Request(`${env.BETTER_AUTH_URL}/api/auth/get-session`, {
    method: "GET",
    headers: getForwardHeaders(req),
  });

export const attachAuthSession = async (
  req: ExpressRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const response = await auth.handler(createAuthRequest(req));

    if (!response.ok) {
      req.auth = null;
      next();
      return;
    }

    const data = (await response.json()) as Express.Request["auth"] | null;
    req.auth = data;
    next();
  } catch {
    req.auth = null;
    next();
  }
};

export const requireAuth = (req: ExpressRequest, res: Response, next: NextFunction): void => {
  if (!req.auth?.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  next();
};
