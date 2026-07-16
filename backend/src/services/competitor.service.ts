import axios from "axios";
import { ReviewModel, ReviewPlatform } from "../models/review.model";
import { assertAppOwner } from "./app.service";
import { findReviews, saveReviews } from "../repositories/review.repository";
export interface CompetitorInput {
  competitorAppName: string;
  playStoreLink?: string;
  appStoreLink?: string;
}
const fetchPlayStore = async (url: string): Promise<Partial<ReviewModel>[]> => {
  try {
    const id = url.match(/[?&]id=([^&]+)/)?.[1];
    if (!id) return [];
    const { data } = await axios.post(
      "https://play.google.com/_/PlayStoreUi/data/batchexecute",
      `f.req=%5B%5B%5B%22UsvDTd%22%2C%22%5Bnull%2Cnull%2C%5B2%2C1%2C%5B40%2Cnull%2Cnull%5D%2Cnull%2C%5B%5D%5D%2C%5B%22${encodeURIComponent(id)}%22%2C7%5D%5D%22%2Cnull%2C%22generic%22%5D%5D%5D`,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      },
    );
    const match = data.match(/\[\[.+\]\]/);
    const rows = match ? JSON.parse(match[0])?.[0]?.[2]?.[0] || [] : [];
    return rows.slice(0, 30).map((r: any) => ({
      reviewerName: r?.[1]?.[0] || "Anonymous",
      rating: r?.[2] || 3,
      reviewText: r?.[4] || "",
      reviewDate: r?.[5]?.[0] ? new Date(r[5][0] * 1000) : new Date(),
    }));
  } catch {
    return [];
  }
};
const fetchAppStore = async (url: string): Promise<Partial<ReviewModel>[]> => {
  try {
    const id = url.match(/\/id(\d+)/)?.[1];
    if (!id) return [];
    const { data } = await axios.get(
      `https://itunes.apple.com/us/rss/customerreviews/id=${id}/sortBy=mostRecent/json`,
      { timeout: 10000 },
    );
    return (data?.feed?.entry || []).slice(0, 30).map((entry: any) => ({
      reviewerName: entry.author?.name?.label || "Anonymous",
      rating: parseInt(entry["im:rating"]?.label || "3"),
      reviewText: entry.content?.label || "",
      reviewDate: entry.updated?.label
        ? new Date(entry.updated.label)
        : new Date(),
    }));
  } catch {
    return [];
  }
};
export const addCompetitor = async (
  appId: string,
  userId: string,
  input: CompetitorInput,
) => {
  await assertAppOwner(appId, userId);
  const reviews: Partial<ReviewModel>[] = [];
  if (input.playStoreLink)
    reviews.push(
      ...(await fetchPlayStore(input.playStoreLink)).map((r) => ({
        ...r,
        appId,
        platform: ReviewPlatform.ANDROID,
        isCompetitor: true,
        competitorAppName: input.competitorAppName,
      })),
    );
  if (input.appStoreLink)
    reviews.push(
      ...(await fetchAppStore(input.appStoreLink)).map((r) => ({
        ...r,
        appId,
        platform: ReviewPlatform.IOS,
        isCompetitor: true,
        competitorAppName: input.competitorAppName,
      })),
    );
  if (reviews.length) await saveReviews(reviews);
  return {
    competitorAppName: input.competitorAppName,
    reviewsFetched: reviews.length,
    message: `${reviews.length} competitor reviews added`,
  };
};
const sentiment = (reviews: ReviewModel[]) => {
  const positive = reviews.filter((r) => r.rating >= 4).length;
  const negative = reviews.filter((r) => r.rating <= 2).length;
  return {
    positive: Math.round((positive / reviews.length) * 100),
    neutral: Math.round(
      ((reviews.length - positive - negative) / reviews.length) * 100,
    ),
    negative: Math.round((negative / reviews.length) * 100),
  };
};
export const compareCompetitor = async (appId: string, userId: string) => {
  await assertAppOwner(appId, userId);
  const own = await findReviews(appId, false, 100);
  const competitors = await findReviews(appId, true, 100);
  if (!own.length || !competitors.length)
    return {
      message: "Not enough data for comparison. Add competitor reviews first.",
      yourAppSentiment: { positive: 0, neutral: 0, negative: 0 },
      competitorSentiment: { positive: 0, neutral: 0, negative: 0 },
      featuresTheyHaveThatUsersWant: [],
      featuresYouHaveThatTheyLack: [],
      commonComplaints: [],
    };
  const wants = [
    "wish",
    "need",
    "want",
    "add",
    "missing",
    "should have",
    "would be nice",
    "please add",
  ];
  return {
    yourAppSentiment: sentiment(own),
    competitorSentiment: sentiment(competitors),
    featuresTheyHaveThatUsersWant: competitors
      .filter((r) =>
        wants.some((word) => r.reviewText.toLowerCase().includes(word)),
      )
      .slice(0, 5)
      .map((r) => r.reviewText.slice(0, 100)),
    featuresYouHaveThatTheyLack: own
      .filter((r) => r.rating >= 4)
      .slice(0, 5)
      .map((r) => r.reviewText.slice(0, 100)),
    commonComplaints: [
      ...own.filter((r) => r.rating <= 2).slice(0, 3),
      ...competitors.filter((r) => r.rating <= 2).slice(0, 3),
    ].map((r) => r.reviewText.slice(0, 100)),
  };
};
