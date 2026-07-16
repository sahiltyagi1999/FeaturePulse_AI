import { Request, Response } from "express";
import {
  addCompetitor,
  compareCompetitor,
} from "../services/competitor.service";
import { routeParam, sendSuccess } from "../utils/http";
export const add = async (req: Request, res: Response) =>
  sendSuccess(
    res,
    await addCompetitor(routeParam(req, "appId"), req.user!.id, req.body),
    201,
  );
export const compare = async (req: Request, res: Response) =>
  sendSuccess(
    res,
    await compareCompetitor(routeParam(req, "appId"), req.user!.id),
  );
