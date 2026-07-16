import { NextFunction, Request, RequestHandler, Response } from "express";
export const asyncHandler =
  (
    handler: (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
export const sendSuccess = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });
export const routeParam = (req: Request, name: string) =>
  String(req.params[name]);
