export type HttpError = Error & { statusCode: number };
export const createHttpError = (
  statusCode: number,
  message: string,
): HttpError => Object.assign(new Error(message), { statusCode });
export const badRequest = (message = "Bad request") =>
  createHttpError(400, message);
export const unauthorized = (message = "Unauthorized") =>
  createHttpError(401, message);
export const forbidden = (message = "Forbidden") =>
  createHttpError(403, message);
export const notFoundError = (message = "Not found") =>
  createHttpError(404, message);
export const conflict = (message = "Conflict") => createHttpError(409, message);
export const serviceUnavailable = (message = "Service unavailable") =>
  createHttpError(503, message);
