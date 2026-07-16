import { EntitySchema } from "typeorm";
export enum JobType {
  FETCH_REVIEWS = "fetch_reviews",
  ANALYSE = "analyse",
}
export enum JobStatus {
  QUEUED = "queued",
  PROCESSING = "processing",
  DONE = "done",
  FAILED = "failed",
}
export interface JobModel {
  id: string;
  appId: string;
  jobType: JobType;
  status: JobStatus;
  progressStep?: string;
  progressPercent: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
export const JobSchema = new EntitySchema<JobModel>({
  name: "JobRecord",
  tableName: "jobs",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    appId: { type: "uuid" },
    jobType: { type: "enum", enum: JobType },
    status: { type: "enum", enum: JobStatus, default: JobStatus.QUEUED },
    progressStep: { type: String, nullable: true },
    progressPercent: { type: Number, default: 0 },
    error: { type: "text", nullable: true },
    createdAt: { type: Date, createDate: true },
    updatedAt: { type: Date, updateDate: true },
  },
  relations: {
    app: {
      type: "many-to-one",
      target: "App",
      joinColumn: { name: "appId" },
      onDelete: "CASCADE",
    },
  } as never,
});
