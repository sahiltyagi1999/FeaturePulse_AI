import { Router } from "express";
import { authRouter } from "./auth.routes";
import { appRouter } from "./app.routes";
import { jobRouter } from "./job.routes";
export const apiRouter = Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/apps", appRouter);
apiRouter.use("/jobs", jobRouter);
