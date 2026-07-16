import { EntitySchema } from "typeorm";
export enum ReviewPlatform {
  IOS = "ios",
  ANDROID = "android",
}
export interface ReviewModel {
  id: string;
  appId: string;
  reviewerName?: string;
  rating: number;
  reviewText: string;
  reviewDate?: Date;
  platform: ReviewPlatform;
  isCompetitor: boolean;
  competitorAppName?: string;
  createdAt: Date;
}
export const ReviewSchema = new EntitySchema<ReviewModel>({
  name: "Review",
  tableName: "reviews",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    appId: { type: "uuid" },
    reviewerName: { type: String, nullable: true },
    rating: { type: Number },
    reviewText: { type: "text" },
    reviewDate: { type: Date, nullable: true },
    platform: { type: "enum", enum: ReviewPlatform },
    isCompetitor: { type: Boolean, default: false },
    competitorAppName: { type: String, nullable: true },
    createdAt: { type: Date, createDate: true },
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
