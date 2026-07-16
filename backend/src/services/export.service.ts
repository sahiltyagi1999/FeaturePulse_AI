import { notFoundError } from "../common/http-error";
import { findLatestAnalysis } from "../repositories/analysis.repository";
import { findReviews } from "../repositories/review.repository";
import { assertAppOwner } from "./app.service";
const cell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const row = (values: unknown[]) => values.map(cell).join(",");
export const createAnalysisCsv = async (appId: string, userId: string) => {
  const app = await assertAppOwner(appId, userId);
  const analysis = await findLatestAnalysis(appId);
  if (!analysis) throw notFoundError("No analysis found");
  const lines = [
    row([
      "App",
      "Platform",
      "Average Rating",
      "Total Reviews",
      "Analysis Date",
    ]),
    row([
      app.appName,
      app.platform,
      app.averageRating,
      app.totalReviews,
      analysis.generatedAt.toISOString().split("T")[0],
    ]),
    "",
    row(["SUMMARY"]),
    row([analysis.summary]),
    "",
    row(["SENTIMENT", "Positive %", "Neutral %", "Negative %"]),
    row([
      "",
      analysis.sentimentBreakdown?.positive,
      analysis.sentimentBreakdown?.neutral,
      analysis.sentimentBreakdown?.negative,
    ]),
    "",
    row(["PRIORITIZED FIXES"]),
  ];
  for (const fix of analysis.prioritizedFixes || [])
    lines.push(
      row([
        fix.rank,
        fix.issue,
        fix.severity,
        fix.frequency,
        fix.description,
        fix.realWorldImpact,
        fix.suggestedFix,
        (fix.supportingReviews || []).join(" | "),
      ]),
    );
  lines.push("", row(["FEATURE IDEAS"]));
  for (const idea of analysis.nextFeatureIdeas || [])
    lines.push(
      row([
        idea.rank,
        idea.featureName,
        idea.userDemand,
        idea.implementationComplexity,
        idea.description,
        idea.whyValid,
        idea.realWorldProblemIfNotAdded,
        (idea.supportingReviews || []).join(" | "),
      ]),
    );
  return lines.join("\n");
};
export const createReviewsCsv = async (appId: string, userId: string) => {
  await assertAppOwner(appId, userId);
  const reviews = await findReviews(appId, false);
  return [
    row(["Reviewer", "Rating", "Platform", "Review Date", "Review Text"]),
    ...reviews.map((review) =>
      row([
        review.reviewerName || "Anonymous",
        review.rating,
        review.platform,
        review.reviewDate?.toISOString().split("T")[0],
        review.reviewText,
      ]),
    ),
  ].join("\n");
};
