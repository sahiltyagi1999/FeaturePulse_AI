import { Job, Worker } from "bullmq";
import OpenAI from "openai";
import { createAnalysisRecord } from "../../repositories/analysis.repository";
import { findAppById } from "../../repositories/app.repository";
import { findReviews } from "../../repositories/review.repository";
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
const promptFor = (app: any, reviews: any[]) =>
  `Analyse reviews for ${app.appName}. Return only JSON with keys summary, prioritizedFixes, nextFeatureIdeas, competitorMentions, sentimentBreakdown. Reviews:\n${reviews.map((r) => `[${r.rating}/5] ${r.reviewText}`).join("\n")}`;
const processAnalysisJob = async (job: Job) => {
  const { appId, jobId } = job.data;
  try {
    await progress(jobId, "Starting analysis...", 5);
    const app = await findAppById(appId);
    if (!app) throw new Error("App not found");
    const reviews = await findReviews(appId, false, 200);
    if (!reviews.length)
      throw new Error("No reviews found. Please fetch reviews first.");
    const prompt = promptFor(app, reviews.slice(0, 150));
    await progress(jobId, "Sending to OpenAI...", 40);
    const response = await new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }).responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      max_output_tokens: 8000,
      instructions: "Return only valid JSON.",
      input: prompt,
    });
    const match = response.output_text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Failed to parse OpenAI response as JSON");
    const data = JSON.parse(match[0]);
    await progress(jobId, "Saving analysis...", 95);
    await createAnalysisRecord({
      appId,
      summary: data.summary || "",
      prioritizedFixes: data.prioritizedFixes || [],
      nextFeatureIdeas: data.nextFeatureIdeas || [],
      competitorMentions: data.competitorMentions || [],
      sentimentBreakdown: data.sentimentBreakdown || {
        positive: 0,
        neutral: 0,
        negative: 0,
      },
      rawPromptUsed: prompt,
    });
    await completeJob(jobId, "Analysis complete!");
    emitComplete(jobId, "Analysis complete!");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    await failJob(jobId, message);
    emitError(jobId, message);
    throw error;
  }
};
export const startAnalysisWorker = () =>
  new Worker("analysis", processAnalysisJob, {
    connection: createWorkerConnection(),
    concurrency: 1,
  });
