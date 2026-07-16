import { assertAppOwner } from "./app.service";
import { createJob } from "./job.service";
import { JobType } from "../models/job.model";
import {
  countReviews,
  deleteReviews,
  findReviewsPage,
  ReviewFilters,
} from "../repositories/review.repository";
import { updateAppRecord } from "../repositories/app.repository";
import { enqueueReviewFetch } from "../infrastructure/queue/queues";
export const getReviewFetchStatus = async (appId: string, userId: string) => {
  const app = await assertAppOwner(appId, userId);
  const reviewCount = await countReviews(appId);
  return {
    lastFetchedAt: app.lastFetchedAt,
    reviewCount,
    message: app.lastFetchedAt
      ? `Last fetched on ${app.lastFetchedAt.toLocaleDateString()}. ${reviewCount} reviews in DB.`
      : "No reviews yet. Fetch now?",
  };
};
export const queueReviewFetch = async (
  appId: string,
  userId: string,
  options: { limit?: number; startDate?: Date; endDate?: Date },
) => {
  await assertAppOwner(appId, userId);
  const job = await createJob(appId, JobType.FETCH_REVIEWS);
  await enqueueReviewFetch({
    appId,
    jobId: job.id,
    limit: options.limit ?? 100,
    startDate: options.startDate?.toISOString(),
    endDate: options.endDate?.toISOString(),
  });
  return { jobId: job.id };
};
export const clearReviews = async (appId: string, userId: string) => {
  await assertAppOwner(appId, userId);
  await deleteReviews(appId);
  await updateAppRecord(appId, { totalReviews: 0, lastFetchedAt: undefined });
  return { message: "All reviews deleted" };
};
export const listReviews = async (
  appId: string,
  userId: string,
  filters: ReviewFilters,
) => {
  await assertAppOwner(appId, userId);
  return findReviewsPage(appId, filters);
};
