import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ProgressGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ProgressGateway');

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinJob')
  handleJoinJob(@MessageBody() jobId: string, @ConnectedSocket() client: Socket) {
    client.join(`job:${jobId}`);
    this.logger.log(`Client ${client.id} joined room job:${jobId}`);
  }

  @SubscribeMessage('leaveJob')
  handleLeaveJob(@MessageBody() jobId: string, @ConnectedSocket() client: Socket) {
    client.leave(`job:${jobId}`);
  }

  emitProgress(jobId: string, data: { step: string; percent: number }) {
    this.server.to(`job:${jobId}`).emit('jobProgress', { jobId, ...data });
  }

  emitComplete(jobId: string, message: string) {
    this.server.to(`job:${jobId}`).emit('jobComplete', { jobId, message });
  }

  emitError(jobId: string, error: string) {
    this.server.to(`job:${jobId}`).emit('jobError', { jobId, error });
  }
}
