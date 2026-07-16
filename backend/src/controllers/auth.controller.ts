import { Request, Response } from "express";
import {
  getUserProfile,
  loginUser,
  registerUser,
} from "../services/auth.service";
import { sendSuccess } from "../utils/http";
export const register = async (req: Request, res: Response) =>
  sendSuccess(res, await registerUser(req.body), 201);
export const login = async (req: Request, res: Response) =>
  sendSuccess(res, await loginUser(req.body));
export const profile = async (req: Request, res: Response) =>
  sendSuccess(res, await getUserProfile(req.user!.id));
