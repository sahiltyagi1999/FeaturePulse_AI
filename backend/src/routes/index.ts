import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import * as appController from "../controllers/app.controller";
import * as reviewController from "../controllers/review.controller";
import * as analysisController from "../controllers/analysis.controller";
import * as competitorController from "../controllers/competitor.controller";
import * as exportController from "../controllers/export.controller";
import * as jobController from "../controllers/job.controller";
import { authenticate as auth } from "../middleware/auth.middleware";
import {
  validateCompetitor,
  validateLogin,
  validateRegister,
} from "../middleware/validation.middleware";
import { asyncHandler } from "../utils/http";

export const router = Router();

router.post(
  "/auth/register",
  validateRegister,
  asyncHandler(authController.register),
);
router.post("/auth/login", validateLogin, asyncHandler(authController.login));
router.get("/auth/profile", auth, asyncHandler(authController.profile));

router.post("/apps/scrape-preview", auth, asyncHandler(appController.preview));
router.post("/apps", auth, asyncHandler(appController.create));
router.get("/apps", auth, asyncHandler(appController.list));
router.get("/apps/:id", auth, asyncHandler(appController.get));
router.delete("/apps/:id", auth, asyncHandler(appController.remove));

router.get(
  "/apps/:appId/fetch-reviews",
  auth,
  asyncHandler(reviewController.fetchStatus),
);
router.post(
  "/apps/:appId/fetch-reviews/confirm",
  auth,
  asyncHandler(reviewController.confirmFetch),
);
router.delete(
  "/apps/:appId/reviews",
  auth,
  asyncHandler(reviewController.clear),
);
router.get("/apps/:appId/reviews", auth, asyncHandler(reviewController.list));

router.post(
  "/apps/:appId/analyse",
  auth,
  asyncHandler(analysisController.queue),
);
router.get(
  "/apps/:appId/analyses",
  auth,
  asyncHandler(analysisController.list),
);
router.get(
  "/apps/:appId/analyses/latest",
  auth,
  asyncHandler(analysisController.latest),
);

router.post(
  "/apps/:appId/competitor",
  auth,
  validateCompetitor,
  asyncHandler(competitorController.add),
);
router.get(
  "/apps/:appId/competitor-analysis",
  auth,
  asyncHandler(competitorController.compare),
);

router.get(
  "/apps/:appId/analyses/latest/export-csv",
  auth,
  asyncHandler(exportController.analysisCsv),
);
router.get(
  "/apps/:appId/reviews/export-csv",
  auth,
  asyncHandler(exportController.reviewsCsv),
);

router.get("/jobs/:id", auth, asyncHandler(jobController.get));
