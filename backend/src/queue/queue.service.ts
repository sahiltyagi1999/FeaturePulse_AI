import { Injectable, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

function isUpstashLimitError(err: any): boolean {
  const msg: string = err?.message || '';
  return (
    msg.includes('max daily request limit') ||
    msg.includes('max monthly request limit') ||
    msg.includes('ERR max') ||
    msg.includes('RATE_LIMIT_EXCEEDED') ||
    msg.includes('rate limit')
  );
}

let sharedConnection: IORedis | null = null;

function buildConnection(): IORedis {
  const rawUrl = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;
  if (!rawUrl) throw new Error('UPSTASH_REDIS_URL is not set');
  if (!token) throw new Error('UPSTASH_REDIS_TOKEN is not set');

  // Upstash dashboard gives an HTTPS REST URL; IORedis needs a rediss:// TCP URL.
  // Extract hostname and build the proper Redis-protocol URL.
  const host = rawUrl.replace(/^https?:\/\//, '');
  const redisUrl = `rediss://default:${token}@${host}:6379`;

  return new IORedis(redisUrl, {
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
    try {
      return await this.reviewQueue.add('fetch', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
    } catch (err) {
      if (isUpstashLimitError(err)) {
        throw new ServiceUnavailableException('Free tier quota reached. The monthly Redis limit has been exceeded. Please try again next month or upgrade your plan.');
      }
      throw err;
    }
  }

  async addAnalysisJob(data: { appId: string; jobId: string }) {
    try {
      return await this.analysisQueue.add('analyse', data, {
        attempts: 2,
        backoff: { type: 'fixed', delay: 5000 },
      });
    } catch (err) {
      if (isUpstashLimitError(err)) {
        throw new ServiceUnavailableException('Free tier quota reached. The monthly Redis limit has been exceeded. Please try again next month or upgrade your plan.');
      }
      throw err;
    }
  }
}
