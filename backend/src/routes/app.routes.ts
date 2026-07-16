import { Router } from "express";
import * as app from "../controllers/app.controller";
import * as review from "../controllers/review.controller";
import * as analysis from "../controllers/analysis.controller";
import * as competitor from "../controllers/competitor.controller";
import * as exporter from "../controllers/export.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateCompetitor } from "../middleware/validation.middleware";
import { asyncHandler } from "../utils/http";
export const appRouter = Router();
appRouter.use(authenticate);
appRouter.post("/scrape-preview", asyncHandler(app.preview));
appRouter.post("/", asyncHandler(app.create));
appRouter.get("/", asyncHandler(app.list));
appRouter.get("/:id", asyncHandler(app.get));
appRouter.delete("/:id", asyncHandler(app.remove));
appRouter.get("/:appId/fetch-reviews", asyncHandler(review.fetchStatus));
appRouter.post(
  "/:appId/fetch-reviews/confirm",
  asyncHandler(review.confirmFetch),
);
appRouter.delete("/:appId/reviews", asyncHandler(review.clear));
appRouter.get("/:appId/reviews", asyncHandler(review.list));
appRouter.post("/:appId/analyse", asyncHandler(analysis.queue));
appRouter.get("/:appId/analyses", asyncHandler(analysis.list));
appRouter.get("/:appId/analyses/latest", asyncHandler(analysis.latest));
appRouter.post(
  "/:appId/competitor",
  validateCompetitor,
  asyncHandler(competitor.add),
);
appRouter.get("/:appId/competitor-analysis", asyncHandler(competitor.compare));
appRouter.get(
  "/:appId/analyses/latest/export-csv",
  asyncHandler(exporter.analysisCsv),
);
appRouter.get("/:appId/reviews/export-csv", asyncHandler(exporter.reviewsCsv));
