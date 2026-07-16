import { EntitySchema } from "typeorm";
export enum Platform {
  IOS = "ios",
  ANDROID = "android",
  BOTH = "both",
}
export interface AppModel {
  id: string;
  userId: string;
  appName: string;
  description?: string;
  appStoreLink?: string;
  playStoreLink?: string;
  iconUrl?: string;
  platform: Platform;
  averageRating?: number;
  totalReviews: number;
  lastFetchedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export const AppSchema = new EntitySchema<AppModel>({
  name: "App",
  tableName: "apps",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    userId: { type: "uuid" },
    appName: { type: String },
    description: { type: "text", nullable: true },
    appStoreLink: { type: String, nullable: true },
    playStoreLink: { type: String, nullable: true },
    iconUrl: { type: String, nullable: true },
    platform: { type: "enum", enum: Platform, default: Platform.BOTH },
    averageRating: { type: "decimal", precision: 3, scale: 2, nullable: true },
    totalReviews: { type: Number, default: 0 },
    lastFetchedAt: { type: Date, nullable: true },
    createdAt: { type: Date, createDate: true },
    updatedAt: { type: Date, updateDate: true },
  },
  relations: {
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "userId" },
      onDelete: "CASCADE",
    },
    reviews: { type: "one-to-many", target: "Review", inverseSide: "app" },
    analyses: { type: "one-to-many", target: "Analysis", inverseSide: "app" },
    jobs: { type: "one-to-many", target: "JobRecord", inverseSide: "app" },
  } as never,
});
