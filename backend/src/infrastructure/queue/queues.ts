import { Queue } from "bullmq";
import IORedis from "ioredis";
import { serviceUnavailable } from "../../common/http-error";
let connection: IORedis | undefined;
let reviewQueue: Queue | undefined;
let analysisQueue: Queue | undefined;
const redis = () => {
  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;
  if (!url || !token) throw new Error("Redis configuration is missing");
  const host = url.replace(/^https?:\/\//, "");
  return new IORedis(`rediss://default:${token}@${host}:6379`, {
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    keepAlive: 10000,
    connectTimeout: 20000,
    commandTimeout: 10000,
  });
};
export const createWorkerConnection = () => redis();
export const initializeQueues = () => {
  connection ??= redis();
  reviewQueue ??= new Queue("review-fetch", { connection });
  analysisQueue ??= new Queue("analysis", { connection });
};
const add = async (
  queue: Queue | undefined,
  name: string,
  data: object,
  options: object,
) => {
  try {
    if (!queue) throw new Error("Queues are not initialized");
    return await queue.add(name, data, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/limit|RATE_LIMIT_EXCEEDED|ERR max/i.test(message))
      throw serviceUnavailable("Redis quota reached. Please try again later.");
    throw error;
  }
};
export const enqueueReviewFetch = async (data: {
  appId: string;
  jobId: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}) =>
  add(reviewQueue, "fetch", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
export const enqueueAnalysis = async (data: { appId: string; jobId: string }) =>
  add(analysisQueue, "analyse", data, {
    attempts: 2,
    backoff: { type: "fixed", delay: 5000 },
  });
