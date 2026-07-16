import { database } from "../config/database";
import { ReviewModel, ReviewSchema } from "../models/review.model";
export interface ReviewFilters {
  page?: number;
  limit?: number;
  rating?: number;
  platform?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}
const repo = () => database.getRepository(ReviewSchema);
export const countReviews = async (appId: string, isCompetitor = false) =>
  repo().count({ where: { appId, isCompetitor } });
export const deleteReviews = async (appId: string, isCompetitor = false) =>
  repo().delete({ appId, isCompetitor });
export const saveReviews = async (reviews: Partial<ReviewModel>[]) =>
  repo().save(reviews.map((review) => repo().create(review)));
export const findReviews = async (
  appId: string,
  isCompetitor: boolean,
  take?: number,
) =>
  repo().find({
    where: { appId, isCompetitor },
    order: { reviewDate: "DESC" },
    ...(take ? { take } : {}),
  });
export const findReviewKeys = async (appId: string) =>
  repo().find({
    where: { appId },
    select: ["reviewerName", "reviewText", "reviewDate"],
  });
export const findReviewsPage = async (
  appId: string,
  filters: ReviewFilters,
) => {
  const {
    page = 1,
    limit = 20,
    rating,
    platform,
    search,
    startDate,
    endDate,
  } = filters;
  const query = repo()
    .createQueryBuilder("review")
    .where("review.appId = :appId AND review.isCompetitor = false", { appId });
  if (rating) query.andWhere("review.rating = :rating", { rating });
  if (platform) query.andWhere("review.platform = :platform", { platform });
  if (search)
    query.andWhere("review.reviewText ILIKE :search", {
      search: `%${search}%`,
    });
  if (startDate)
    query.andWhere("review.reviewDate >= :startDate", { startDate });
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query.andWhere("review.reviewDate <= :end", { end });
  }
  query
    .orderBy("review.reviewDate", "DESC")
    .skip((page - 1) * limit)
    .take(limit);
  const [items, total] = await query.getManyAndCount();
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};
