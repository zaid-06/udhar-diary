import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middlewares/validate.js";

const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

const echoBodySchema = z.object({
  message: z.string().min(1),
});

healthRouter.post("/echo", validate(echoBodySchema), (req, res) => {
  res.json({
    message: req.body.message,
  });
});

export { healthRouter };
