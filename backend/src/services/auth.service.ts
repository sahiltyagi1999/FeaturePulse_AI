import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { conflict, unauthorized } from "../common/http-error";
import {
  createUser,
  findUserByEmail,
  findUserById,
} from "../repositories/user.repository";
export interface AuthInput {
  email: string;
  password: string;
  name?: string;
}
const publicUser = (user: { id: string; email: string; name: string }) => ({
  id: user.id,
  email: user.email,
  name: user.name,
});
export const registerUser = async (input: AuthInput) => {
  if (await findUserByEmail(input.email))
    throw conflict("Email already in use");
  const user = await createUser({
    name: input.name!,
    email: input.email,
    password: await bcrypt.hash(input.password, 10),
  });
  return {
    token: jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" },
    ),
    user: publicUser(user),
  };
};
export const loginUser = async (input: AuthInput) => {
  const user = await findUserByEmail(input.email);
  if (!user || !(await bcrypt.compare(input.password, user.password)))
    throw unauthorized("Invalid credentials");
  return {
    token: jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" },
    ),
    user: publicUser(user),
  };
};
export const getUserProfile = async (id: string) => {
  const user = await findUserById(id);
  if (!user) throw unauthorized();
  return { ...publicUser(user), createdAt: user.createdAt };
};
