import { Server } from "socket.io";
let socketServer: Server;
export const initializeProgressSocket = (server: Server) => {
  socketServer = server;
  server.on("connection", (socket) => {
    console.log(`[socket] connected: ${socket.id}`);
    socket.on("joinJob", (jobId: string) => socket.join(`job:${jobId}`));
    socket.on("leaveJob", (jobId: string) => socket.leave(`job:${jobId}`));
  });
};
export const emitProgress = (jobId: string, step: string, percent: number) =>
  socketServer.to(`job:${jobId}`).emit("jobProgress", { jobId, step, percent });
export const emitComplete = (jobId: string, message: string) =>
  socketServer.to(`job:${jobId}`).emit("jobComplete", { jobId, message });
export const emitError = (jobId: string, error: string) =>
  socketServer.to(`job:${jobId}`).emit("jobError", { jobId, error });
