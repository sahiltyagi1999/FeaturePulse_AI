import { Request, Response } from "express";
import {
  createAnalysisCsv,
  createReviewsCsv,
} from "../services/export.service";
import { routeParam } from "../utils/http";
const download = (res: Response, filename: string, csv: string) =>
  res
    .set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    })
    .send("\uFEFF" + csv);
export const analysisCsv = async (req: Request, res: Response) =>
  download(
    res,
    "featurepulse-analysis.csv",
    await createAnalysisCsv(routeParam(req, "appId"), req.user!.id),
  );
export const reviewsCsv = async (req: Request, res: Response) =>
  download(
    res,
    "featurepulse-reviews.csv",
    await createReviewsCsv(routeParam(req, "appId"), req.user!.id),
  );
