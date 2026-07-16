import { Request, Response } from "express";
import {
  clearReviews,
  getReviewFetchStatus,
  listReviews,
  queueReviewFetch,
} from "../services/review.service";
import { routeParam, sendSuccess } from "../utils/http";
export const fetchStatus = async (req: Request, res: Response) =>
  sendSuccess(
    res,
    await getReviewFetchStatus(routeParam(req, "appId"), req.user!.id),
  );
export const confirmFetch = async (req: Request, res: Response) =>
  sendSuccess(
    res,
    await queueReviewFetch(routeParam(req, "appId"), req.user!.id, {
      limit: req.body?.limit,
      startDate: req.body?.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body?.endDate ? new Date(req.body.endDate) : undefined,
    }),
    201,
  );
export const clear = async (req: Request, res: Response) =>
  sendSuccess(res, await clearReviews(routeParam(req, "appId"), req.user!.id));
export const list = async (req: Request, res: Response) =>
  sendSuccess(
    res,
    await listReviews(routeParam(req, "appId"), req.user!.id, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      rating: req.query.rating ? Number(req.query.rating) : undefined,
      platform: req.query.platform as string,
      search: req.query.search as string,
      startDate: req.query.startDate
        ? new Date(String(req.query.startDate))
        : undefined,
      endDate: req.query.endDate
        ? new Date(String(req.query.endDate))
        : undefined,
    }),
  );
