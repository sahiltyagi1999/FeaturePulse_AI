import { NextFunction, Request, Response } from "express";
import { badRequest } from "../common/http-error";
const required = (value: unknown, field: string) => {
  if (typeof value !== "string" || !value.trim())
    throw badRequest(`${field} must be a non-empty string`);
};
export const validateRegister = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    required(req.body?.name, "name");
    required(req.body?.email, "email");
    required(req.body?.password, "password");
    if (!/^\S+@\S+\.\S+$/.test(req.body.email))
      throw badRequest("email must be valid");
    if (req.body.password.length < 6)
      throw badRequest("password must be at least 6 characters");
    next();
  } catch (error) {
    next(error);
  }
};
export const validateLogin = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    required(req.body?.email, "email");
    required(req.body?.password, "password");
    next();
  } catch (error) {
    next(error);
  }
};
export const validateCompetitor = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    required(req.body?.competitorAppName, "competitorAppName");
    next();
  } catch (error) {
    next(error);
  }
};
