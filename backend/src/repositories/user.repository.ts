import { database } from "../config/database";
import { UserModel, UserSchema } from "../models/user.model";
export const findUserByEmail = async (email: string) =>
  database.getRepository(UserSchema).findOne({ where: { email } });
export const findUserById = async (id: string) =>
  database.getRepository(UserSchema).findOne({ where: { id } });
export const createUser = async (
  data: Pick<UserModel, "name" | "email" | "password">,
) =>
  database
    .getRepository(UserSchema)
    .save(database.getRepository(UserSchema).create(data));
