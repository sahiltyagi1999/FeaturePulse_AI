import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app";
import { connectDatabase } from "./config/database";
import { initializeQueues } from "./infrastructure/queue/queues";
import { startAnalysisWorker } from "./infrastructure/queue/analysis.worker";
import { startReviewWorker } from "./infrastructure/queue/review.worker";
import { initializeProgressSocket } from "./infrastructure/websocket/progress.socket";
export const startServer = async () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  await connectDatabase();
  initializeQueues();
  const app = createApp();
  const server = http.createServer(app);
  initializeProgressSocket(new Server(server, { cors: { origin: "*" } }));
  startReviewWorker();
  startAnalysisWorker();
  const port = Number(process.env.PORT) || 3000;
  server.listen(port, () =>
    console.log(`FeaturePulse AI Express backend running on port ${port}`),
  );
  return server;
};
startServer().catch((error) => {
  console.error("Backend startup failed:", error);
  process.exit(1);
});
