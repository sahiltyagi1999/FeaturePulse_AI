import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { apiRouter } from "./routes";
import { handleError, notFound } from "./middleware/error.middleware";
const documented = [
  ["post", "/auth/register"],
  ["post", "/auth/login"],
  ["get", "/auth/profile"],
  ["post", "/apps"],
  ["get", "/apps"],
  ["get", "/apps/{id}"],
  ["delete", "/apps/{id}"],
  ["get", "/apps/{appId}/reviews"],
  ["post", "/apps/{appId}/analyse"],
  ["get", "/jobs/{id}"],
];
const paths: Record<string, any> = {};
documented.forEach(([method, path]) => {
  paths[path] ??= {};
  paths[path][method] = { responses: { 200: { description: "Success" } } };
});
const docs = {
  openapi: "3.0.0",
  info: { title: "FeaturePulse AI API", version: "1.0.0" },
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  },
  paths,
};
export const createApp = () => {
  const app = express();
  app.use(
    cors({
      origin: [
        process.env.FRONTEND_URL || "http://localhost:5173",
        "http://localhost:5173",
        "http://localhost:5174",
      ],
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(apiRouter);
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(docs));
  app.use(notFound);
  app.use(handleError);
  return app;
};
