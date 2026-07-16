import { Request, Response } from "express";
import { getJob } from "../services/job.service";
import { assertAppOwner } from "../services/app.service";
import { routeParam, sendSuccess } from "../utils/http";
export const get = async (req: Request, res: Response) => {
  const job = await getJob(routeParam(req, "id"));
  await assertAppOwner(job.appId, req.user!.id);
  return sendSuccess(res, job);
};
