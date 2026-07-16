import { Request, Response } from "express";
import {
  getLatestAppAnalysis,
  listAppAnalyses,
  queueAppAnalysis,
} from "../services/analysis.service";
import { routeParam, sendSuccess } from "../utils/http";
export const queue = async (req: Request, res: Response) =>
  sendSuccess(
    res,
    await queueAppAnalysis(routeParam(req, "appId"), req.user!.id),
    201,
  );
export const list = async (req: Request, res: Response) =>
  sendSuccess(
    res,
    await listAppAnalyses(routeParam(req, "appId"), req.user!.id),
  );
export const latest = async (req: Request, res: Response) =>
  sendSuccess(
    res,
    await getLatestAppAnalysis(routeParam(req, "appId"), req.user!.id),
  );
