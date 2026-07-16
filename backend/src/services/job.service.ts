import { notFoundError } from "../common/http-error";
import { JobStatus, JobType } from "../models/job.model";
import {
  createJobRecord,
  findJobRecord,
  updateJobRecord,
} from "../repositories/job.repository";
export const createJob = async (appId: string, type: JobType) =>
  createJobRecord(appId, type);
export const getJob = async (id: string) => {
  const job = await findJobRecord(id);
  if (!job) throw notFoundError("Job not found");
  return job;
};
export const updateJobProgress = async (
  id: string,
  step: string,
  percent: number,
) =>
  updateJobRecord(id, {
    status: JobStatus.PROCESSING,
    progressStep: step,
    progressPercent: percent,
  });
export const completeJob = async (id: string, step: string) =>
  updateJobRecord(id, {
    status: JobStatus.DONE,
    progressStep: step,
    progressPercent: 100,
  });
export const failJob = async (id: string, error: string) =>
  updateJobRecord(id, { status: JobStatus.FAILED, error });
