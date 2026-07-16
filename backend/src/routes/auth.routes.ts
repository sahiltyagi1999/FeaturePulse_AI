import { Router } from "express";
import { login, profile, register } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
  validateLogin,
  validateRegister,
} from "../middleware/validation.middleware";
import { asyncHandler } from "../utils/http";
export const authRouter = Router();
authRouter.post("/register", validateRegister, asyncHandler(register));
authRouter.post("/login", validateLogin, asyncHandler(login));
authRouter.get("/profile", authenticate, asyncHandler(profile));
