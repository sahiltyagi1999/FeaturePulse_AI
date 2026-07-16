import { NextFunction, Request, Response } from "express";
export const notFound = (_req: Request, res: Response) =>
  res.status(404).json({ statusCode: 404, message: "Route not found" });
export const handleError = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode =
    error instanceof Error && "statusCode" in error
      ? Number(error.statusCode)
      : 500;
  const message =
    error instanceof Error ? error.message : "Internal server error";
  if (statusCode === 500) console.error(error);
  res.status(statusCode).json({
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    message,
  });
};
