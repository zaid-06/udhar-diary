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
    origin: [
      "http://localhost:3000",
      "http://192.168.31.144:3000",
    ],
    credentials: true,
  }),
);
app.use(express.json());

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api", moduleRouter);

app.use(errorHandler);

export { app };
