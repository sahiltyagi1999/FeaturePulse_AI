import axios from "axios";
import * as cheerio from "cheerio";
import { badRequest, forbidden, notFoundError } from "../common/http-error";
import { AppModel, Platform } from "../models/app.model";
import {
  createAppRecord,
  findAppById,
  findAppsByUser,
  removeAppRecord,
} from "../repositories/app.repository";
export interface AppLinks {
  playStoreLink?: string;
  appStoreLink?: string;
}
const scrapePlayStore = async (url: string) => {
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "en-US,en;q=0.9",
    },
    timeout: 10000,
  });
  const $ = cheerio.load(data);
  const rating = $(
    'div[itemprop="starRating"] meta[itemprop="ratingValue"]',
  ).attr("content");
  return {
    appName:
      $('h1[itemprop="name"]').text().trim() ||
      $("h1").first().text().trim() ||
      "Unknown",
    description:
      $('[data-g-id="description"]').text().trim().slice(0, 500) ||
      $('meta[name="description"]').attr("content") ||
      "",
    iconUrl:
      $('img[alt="Icon image"]').attr("src") ||
      $('img[itemprop="image"]').attr("src") ||
      "",
    averageRating: rating ? parseFloat(rating) : undefined,
  };
};
const scrapeAppStore = async (url: string) => {
  const id = url.match(/\/id(\d+)/)?.[1];
  if (!id) return {};
  const { data } = await axios.get(
    `https://itunes.apple.com/lookup?id=${id}&country=us`,
    { timeout: 10000 },
  );
  const item = data?.results?.[0];
  return item
    ? {
        appName: item.trackName || "Unknown",
        description: (item.description || "").slice(0, 500),
        iconUrl: item.artworkUrl512 || item.artworkUrl100 || "",
        averageRating: item.averageUserRating || undefined,
      }
    : {};
};
export const scrapeAppInfo = async (
  links: AppLinks,
): Promise<Partial<AppModel>> => {
  let info: Partial<AppModel> = {
    appName: "Unknown App",
    description: "",
    iconUrl: "",
  };
  try {
    if (links.playStoreLink)
      info = { ...info, ...(await scrapePlayStore(links.playStoreLink)) };
    else if (links.appStoreLink)
      info = { ...info, ...(await scrapeAppStore(links.appStoreLink)) };
  } catch (error) {
    console.warn(
      "Store scrape failed:",
      error instanceof Error ? error.message : error,
    );
  }
  info.platform =
    links.playStoreLink && links.appStoreLink
      ? Platform.BOTH
      : links.playStoreLink
        ? Platform.ANDROID
        : Platform.IOS;
  return info;
};
export const assertAppOwner = async (id: string, userId: string) => {
  const app = await findAppById(id);
  if (!app) throw notFoundError("App not found");
  if (app.userId !== userId) throw forbidden();
  return app;
};
export const createApp = async (userId: string, links: AppLinks) => {
  if (!links.playStoreLink && !links.appStoreLink)
    throw badRequest("Provide at least one store link");
  return createAppRecord({ userId, ...links, ...(await scrapeAppInfo(links)) });
};
export const listApps = async (userId: string) => findAppsByUser(userId);
export const getApp = async (id: string, userId: string) =>
  assertAppOwner(id, userId);
export const deleteApp = async (id: string, userId: string) =>
  removeAppRecord(await assertAppOwner(id, userId));
