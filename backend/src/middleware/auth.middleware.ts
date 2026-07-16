import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { unauthorized } from "../common/http-error";
import { findUserById } from "../repositories/user.repository";
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return next(unauthorized("Invalid or expired token"));
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret",
    ) as jwt.JwtPayload;
    const user = await findUserById(String(payload.sub));
    if (!user) throw new Error();
    req.user = { id: user.id, email: user.email, name: user.name };
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
};
