import "reflect-metadata";
import { DataSource } from "typeorm";
import { UserSchema } from "../models/user.model";
import { AppSchema } from "../models/app.model";
import { ReviewSchema } from "../models/review.model";
import { AnalysisSchema } from "../models/analysis.model";
import { JobSchema } from "../models/job.model";

export const database = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [UserSchema, AppSchema, ReviewSchema, AnalysisSchema, JobSchema],
  synchronize: true,
  logging: false,
  ssl: process.env.DATABASE_URL?.includes("ssl")
    ? { rejectUnauthorized: false }
    : false,
});

export const connectDatabase = async () => {
  if (!database.isInitialized) await database.initialize();
};
