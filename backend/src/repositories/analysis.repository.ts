import { database } from "../config/database";
import { AnalysisModel, AnalysisSchema } from "../models/analysis.model";
const repo = () => database.getRepository(AnalysisSchema);
export const createAnalysisRecord = async (data: Partial<AnalysisModel>) =>
  repo().save(repo().create(data));
export const findAnalysesByApp = async (appId: string) =>
  repo().find({ where: { appId }, order: { generatedAt: "DESC" } });
export const findLatestAnalysis = async (appId: string) =>
  repo().findOne({ where: { appId }, order: { generatedAt: "DESC" } });
