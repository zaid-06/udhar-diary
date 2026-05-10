import { Router, type Request as ExpressRequest, type Response as ExpressResponse } from "express";
import { auth } from "../../auth/auth.config.js";
import { attachAuthSession, requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import { env } from "../../utils/env.js";
import { sendSuccess } from "../../utils/api-response.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

const authRouter = Router();

type AuthRoute = "/sign-up/email" | "/sign-in/email" | "/sign-out" | "/get-session";

const buildHeaders = (req: ExpressRequest): Headers => {
  const headers = new Headers({
    "content-type": "application/json",
  });

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

const forwardToBetterAuth = async (
  req: ExpressRequest,
  route: AuthRoute,
  method: "GET" | "POST",
  body?: Record<string, unknown>,
): Promise<globalThis.Response> => {
  const request = new globalThis.Request(`${env.BETTER_AUTH_URL}/api/auth${route}`, {
    method,
    headers: buildHeaders(req),
    body: body ? JSON.stringify(body) : undefined,
  });

  return auth.handler(request);
};

const sendAuthResponse = async (
  expressRes: ExpressResponse,
  authRes: globalThis.Response,
): Promise<void> => {
  const setCookies = authRes.headers.getSetCookie?.() ?? [];

  if (setCookies.length > 0) {
    expressRes.setHeader("set-cookie", setCookies);
  } else {
    const singleCookie = authRes.headers.get("set-cookie");
    if (singleCookie) {
      expressRes.setHeader("set-cookie", singleCookie);
    }
  }

  const text = await authRes.text();
  expressRes.status(authRes.status).type("application/json").send(text);
};

authRouter.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const authRes = await forwardToBetterAuth(req, "/sign-up/email", "POST", {
      name: req.body?.name,
      email: req.body?.email,
      password: req.body?.password,
    });

    await sendAuthResponse(res, authRes);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const authRes = await forwardToBetterAuth(req, "/sign-in/email", "POST", {
      email: req.body?.email,
      password: req.body?.password,
      rememberMe: req.body?.rememberMe,
    });

    await sendAuthResponse(res, authRes);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    const authRes = await forwardToBetterAuth(req, "/sign-out", "POST");
    await sendAuthResponse(res, authRes);
  } catch (error) {
    next(error);
  }
});

authRouter.get("/session-user", attachAuthSession, requireAuth, (req, res) => {
  sendSuccess(res, "Current user fetched", {
    user: req.auth?.user,
    session: req.auth?.session,
  });
});

export { authRouter };
