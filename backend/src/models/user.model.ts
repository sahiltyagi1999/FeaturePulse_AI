import { EntitySchema } from "typeorm";

export interface UserModel {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
}
export const UserSchema = new EntitySchema<UserModel>({
  name: "User",
  tableName: "users",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    email: { type: String, unique: true },
    password: { type: String },
    name: { type: String },
    createdAt: { type: Date, createDate: true },
  },
  relations: {
    apps: { type: "one-to-many", target: "App", inverseSide: "user" },
  } as never,
});
