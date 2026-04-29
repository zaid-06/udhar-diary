import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth/auth.config.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { moduleRouter } from "./modules/index.js";
import { env } from "./utils/env.js";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api", moduleRouter);

app.use(errorHandler);

export { app };
