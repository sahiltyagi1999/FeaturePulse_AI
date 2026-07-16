import { assertAppOwner } from "./app.service";
import { createJob } from "./job.service";
import { JobType } from "../models/job.model";
import { enqueueAnalysis } from "../infrastructure/queue/queues";
import {
  findAnalysesByApp,
  findLatestAnalysis,
} from "../repositories/analysis.repository";
export const queueAppAnalysis = async (appId: string, userId: string) => {
  await assertAppOwner(appId, userId);
  const job = await createJob(appId, JobType.ANALYSE);
  await enqueueAnalysis({ appId, jobId: job.id });
  return { jobId: job.id };
};
export const listAppAnalyses = async (appId: string, userId: string) => {
  await assertAppOwner(appId, userId);
  return findAnalysesByApp(appId);
};
export const getLatestAppAnalysis = async (appId: string, userId: string) => {
  await assertAppOwner(appId, userId);
  return findLatestAnalysis(appId);
};
