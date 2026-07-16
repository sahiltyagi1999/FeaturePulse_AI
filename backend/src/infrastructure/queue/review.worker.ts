import { Job, Worker } from "bullmq";
import * as gplay from "google-play-scraper";
import * as store from "app-store-scraper";
import { ReviewModel, ReviewPlatform } from "../../models/review.model";
import {
  findAppById,
  updateAppRecord,
} from "../../repositories/app.repository";
import {
  countReviews,
  findReviewKeys,
  saveReviews,
} from "../../repositories/review.repository";
import {
  completeJob,
  failJob,
  updateJobProgress,
} from "../../services/job.service";
import {
  emitComplete,
  emitError,
  emitProgress,
} from "../websocket/progress.socket";
import { createWorkerConnection } from "./queues";
const progress = async (jobId: string, step: string, percent: number) => {
  await updateJobProgress(jobId, step, percent);
  emitProgress(jobId, step, percent);
};
const playStoreReviews = async (
  url: string,
  limit: number,
  jobId: string,
): Promise<Partial<ReviewModel>[]> => {
  const id = url.match(/[?&]id=([^&]+)/)?.[1];
  if (!id) throw new Error("Invalid Play Store URL");
  const output: Partial<ReviewModel>[] = [];
  let token: string | undefined;
  const pages = Math.ceil(limit / 150);
  for (let page = 0; page < pages; page++) {
    await progress(
      jobId,
      `Fetching Play Store page ${page + 1} of ${pages}...`,
      10 + Math.round(((page + 1) / pages) * 40),
    );
    const response: any = await (gplay as any).reviews({
      appId: id,
      sort: (gplay as any).sort?.NEWEST ?? 2,
      num: 150,
      paginate: true,
      nextPaginationToken: token,
      lang: "en",
      country: "us",
    });
    output.push(
      ...response.data.map((r: any) => ({
        reviewerName: r.userName || "Anonymous",
        rating: r.score || 3,
        reviewText: r.text || "",
        reviewDate: r.date ? new Date(r.date) : new Date(),
      })),
    );
    token = response.nextPaginationToken;
    if (!token || output.length >= limit) break;
  }
  return output;
};
const appStoreReviews = async (
  url: string,
  limit: number,
  jobId: string,
): Promise<Partial<ReviewModel>[]> => {
  const id = url.match(/\/id(\d+)/)?.[1];
  if (!id) throw new Error("Invalid App Store URL");
  const output: Partial<ReviewModel>[] = [];
  const pages = Math.min(Math.ceil(limit / 50), 10);
  for (let page = 1; page <= pages; page++) {
    await progress(
      jobId,
      `Fetching App Store page ${page} of ${pages}...`,
      60 + Math.round((page / pages) * 18),
    );
    const reviews = await store.reviews({
      id: Number(id),
      sort: store.sort.RECENT,
      page,
      country: "us",
    });
    output.push(
      ...reviews.map((r) => ({
        reviewerName: r.userName || "Anonymous",
        rating: r.score || 3,
        reviewText: r.text || "",
        reviewDate: r.updated ? new Date(r.updated) : new Date(),
      })),
    );
    if (output.length >= limit) break;
  }
  return output;
};
const key = (review: Partial<ReviewModel>) =>
  `${review.reviewerName}|${review.reviewText?.slice(0, 80)}|${review.reviewDate ? new Date(review.reviewDate).toDateString() : ""}`;
const processReviewJob = async (job: Job) => {
  const { appId, jobId, limit = 100, startDate, endDate } = job.data;
  try {
    const app = await findAppById(appId);
    if (!app) throw new Error("App not found");
    await progress(jobId, "Starting review fetch...", 5);
    let reviews: Partial<ReviewModel>[] = [];
    if (app.playStoreLink)
      reviews.push(
        ...(await playStoreReviews(app.playStoreLink, limit, jobId)).map(
          (r) => ({
            ...r,
            appId,
            platform: ReviewPlatform.ANDROID,
            isCompetitor: false,
          }),
        ),
      );
    if (app.appStoreLink)
      reviews.push(
        ...(await appStoreReviews(app.appStoreLink, limit, jobId)).map((r) => ({
          ...r,
          appId,
          platform: ReviewPlatform.IOS,
          isCompetitor: false,
        })),
      );
    reviews = reviews
      .filter(
        (r) =>
          (!startDate ||
            !r.reviewDate ||
            r.reviewDate >= new Date(startDate)) &&
          (!endDate || !r.reviewDate || r.reviewDate <= new Date(endDate)),
      )
      .slice(0, limit);
    const seen = new Set<string>();
    const existing = new Set((await findReviewKeys(appId)).map(key));
    const unique = reviews.filter((r) => {
      const id = key(r);
      if (seen.has(id) || existing.has(id)) return false;
      seen.add(id);
      return true;
    });
    await progress(jobId, `Saving ${unique.length} reviews to database...`, 92);
    if (unique.length) await saveReviews(unique);
    const totalReviews = await countReviews(appId);
    await updateAppRecord(appId, { totalReviews, lastFetchedAt: new Date() });
    const message = `Done! ${unique.length} new reviews saved.`;
    await completeJob(jobId, message);
    emitComplete(jobId, message);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Review fetch failed";
    await failJob(jobId, message);
    emitError(jobId, message);
    throw error;
  }
};
export const startReviewWorker = () =>
  new Worker("review-fetch", processReviewJob, {
    connection: createWorkerConnection(),
    concurrency: 2,
  });
