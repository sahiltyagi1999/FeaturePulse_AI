import { database } from "../config/database";
import { AppModel, AppSchema } from "../models/app.model";
const repo = () => database.getRepository(AppSchema);
export const createAppRecord = async (data: Partial<AppModel>) =>
  repo().save(repo().create(data));
export const findAppById = async (id: string) =>
  repo().findOne({ where: { id } });
export const findAppsByUser = async (userId: string) =>
  repo().find({ where: { userId }, order: { createdAt: "DESC" } });
export const removeAppRecord = async (app: AppModel) => repo().remove(app);
export const updateAppRecord = async (id: string, data: Partial<AppModel>) =>
  repo().update(id, data);
