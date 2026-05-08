import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

let sharedConnection: IORedis | null = null;

function buildConnection(): IORedis {
  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;
  if (!url) throw new Error('UPSTASH_REDIS_URL is not set');

  return new IORedis(url, {
    password: token,
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
    keepAlive: 10000,
    connectTimeout: 20000,
    commandTimeout: 10000,
  });
}

// All queues and workers share the same connection to stay within Upstash limits
export function getSharedRedisConnection(): IORedis {
  if (!sharedConnection || sharedConnection.status === 'end') {
    sharedConnection = buildConnection();
  }
  return sharedConnection;
}

// BullMQ workers require their own connection (it blocks during BRPOP),
// but we still use a factory so options are consistent
export function createRedisConnection(): IORedis {
  return buildConnection();
}

@Injectable()
export class QueueService implements OnModuleInit {
  private reviewQueue: Queue;
  private analysisQueue: Queue;

  onModuleInit() {
    const conn = getSharedRedisConnection();
    this.reviewQueue = new Queue('review-fetch', { connection: conn });
    this.analysisQueue = new Queue('analysis', { connection: conn });
  }

  async addReviewFetchJob(data: { appId: string; jobId: string; limit?: number; startDate?: string; endDate?: string }) {
    return this.reviewQueue.add('fetch', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  async addAnalysisJob(data: { appId: string; jobId: string }) {
    return this.analysisQueue.add('analyse', data, {
      attempts: 2,
      backoff: { type: 'fixed', delay: 5000 },
    });
  }
}
