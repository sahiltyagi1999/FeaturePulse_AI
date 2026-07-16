import { Router } from "express";
import { get } from "../controllers/job.controller";
import { authenticate } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/http";
export const jobRouter = Router();
jobRouter.get("/:id", authenticate, asyncHandler(get));
