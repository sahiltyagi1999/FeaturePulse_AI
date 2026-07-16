import { database } from "../config/database";
import { JobModel, JobSchema, JobStatus, JobType } from "../models/job.model";
const repo = () => database.getRepository(JobSchema);
export const createJobRecord = async (appId: string, jobType: JobType) =>
  repo().save(repo().create({ appId, jobType, status: JobStatus.QUEUED }));
export const findJobRecord = async (id: string) =>
  repo().findOne({ where: { id } });
export const updateJobRecord = async (id: string, data: Partial<JobModel>) =>
  repo().update(id, data);
