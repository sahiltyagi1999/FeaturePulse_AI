import { Request, Response } from "express";
import {
  createApp,
  deleteApp,
  getApp,
  listApps,
  scrapeAppInfo,
} from "../services/app.service";
import { routeParam, sendSuccess } from "../utils/http";
export const create = async (req: Request, res: Response) =>
  sendSuccess(res, await createApp(req.user!.id, req.body), 201);
export const list = async (req: Request, res: Response) =>
  sendSuccess(res, await listApps(req.user!.id));
export const get = async (req: Request, res: Response) =>
  sendSuccess(res, await getApp(routeParam(req, "id"), req.user!.id));
export const remove = async (req: Request, res: Response) =>
  sendSuccess(res, await deleteApp(routeParam(req, "id"), req.user!.id));
export const preview = async (req: Request, res: Response) =>
  sendSuccess(res, await scrapeAppInfo(req.body), 201);
