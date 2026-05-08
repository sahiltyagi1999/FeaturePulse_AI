import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Worker, Job } from 'bullmq';
import * as gplay from 'google-play-scraper';
import * as store from 'app-store-scraper'; // types in src/types/app-store-scraper.d.ts
import { Review, ReviewPlatform } from '../../reviews/entities/review.entity';
import { App } from '../../apps/entities/app.entity';
import { JobsService } from '../../jobs/jobs.service';
import { ProgressGateway } from '../../websocket/progress.gateway';
import { createRedisConnection } from '../queue.service';

@Injectable()
export class ReviewFetchWorker implements OnModuleInit {
  private readonly logger = new Logger(ReviewFetchWorker.name);

  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(App)
    private appRepository: Repository<App>,
    private jobsService: JobsService,
    private progressGateway: ProgressGateway,
  ) {}

  onModuleInit() {
    const conn = createRedisConnection();
    const worker = new Worker(
      'review-fetch',
      async (job: Job) => this.process(job),
      { connection: conn, concurrency: 2 },
    );
    worker.on('completed', (job) => this.logger.log(`Review fetch job ${job.id} completed`));
    worker.on('failed', (job, err) => this.logger.error(`Review fetch job ${job?.id} failed`, err.stack));
  }

  private async progress(jobId: string, step: string, percent: number) {
    await this.jobsService.updateProgress(jobId, step, percent);
    this.progressGateway.emitProgress(jobId, { step, percent });
  }

  private async process(job: Job) {
    const { appId, jobId, limit = 100, startDate, endDate } = job.data;
    const startDateObj: Date | null = startDate ? new Date(startDate) : null;
    const endDateObj: Date | null = endDate ? new Date(endDate) : null;

    try {
      const app = await this.appRepository.findOne({ where: { id: appId } });
      if (!app) throw new Error('App not found');

      await this.progress(jobId, 'Starting review fetch...', 5);

      let allReviews: Partial<Review>[] = [];

      if (app.playStoreLink) {
        await this.progress(jobId, 'Connecting to Play Store...', 10);
        const androidReviews = await this.fetchPlayStoreReviews(app.playStoreLink, limit, jobId);
        allReviews.push(...androidReviews.map((r) => ({ ...r, appId, platform: ReviewPlatform.ANDROID })));
        await this.progress(jobId, `Fetched ${androidReviews.length} Android reviews`, 55);
      }

      if (app.appStoreLink) {
        await this.progress(jobId, 'Connecting to App Store...', 60);
        const iosReviews = await this.fetchAppStoreReviews(app.appStoreLink, limit, jobId);
        allReviews.push(...iosReviews.map((r) => ({ ...r, appId, platform: ReviewPlatform.IOS })));
        await this.progress(jobId, `Fetched ${iosReviews.length} iOS reviews`, 80);
      }

      // Apply date range filter
      if (startDateObj || endDateObj) {
        const label = startDateObj && endDateObj
          ? `${startDateObj.toLocaleDateString()} – ${endDateObj.toLocaleDateString()}`
          : startDateObj ? `after ${startDateObj.toLocaleDateString()}` : `before ${endDateObj!.toLocaleDateString()}`;
        await this.progress(jobId, `Filtering reviews: ${label}...`, 82);
        allReviews = allReviews.filter((r) => {
          if (!r.reviewDate) return true;
          const d = new Date(r.reviewDate);
          if (startDateObj && d < startDateObj) return false;
          if (endDateObj) {
            const end = new Date(endDateObj);
            end.setHours(23, 59, 59, 999);
            if (d > end) return false;
          }
          return true;
        });
      }

      // Trim to limit
      allReviews = allReviews.slice(0, limit);

      await this.progress(jobId, 'Checking for duplicates in database...', 85);

      // Deduplicate within the fetched batch
      const seen = new Set<string>();
      const batchUnique = allReviews.filter((r) => {
        const key = `${r.reviewerName}|${r.reviewText?.slice(0, 80)}|${r.reviewDate ? new Date(r.reviewDate).toDateString() : ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Deduplicate against existing DB reviews
      const existing = await this.reviewRepository.find({
        where: { appId },
        select: ['reviewerName', 'reviewText', 'reviewDate'],
      });
      const dbKeys = new Set(existing.map((r) =>
        `${r.reviewerName}|${r.reviewText?.slice(0, 80)}|${r.reviewDate ? new Date(r.reviewDate).toDateString() : ''}`
      ));
      const unique = batchUnique.filter((r) => {
        const key = `${r.reviewerName}|${r.reviewText?.slice(0, 80)}|${r.reviewDate ? new Date(r.reviewDate).toDateString() : ''}`;
        return !dbKeys.has(key);
      });

      await this.progress(jobId, `Saving ${unique.length} reviews to database...`, 92);
      if (unique.length > 0) {
        await this.reviewRepository.save(unique);
      }

      await this.progress(jobId, 'Updating app statistics...', 97);
      const totalReviews = await this.reviewRepository.count({ where: { appId } });
      await this.appRepository.update(appId, { totalReviews, lastFetchedAt: new Date() });

      const doneMsg = `Done! ${unique.length} new reviews saved.`;
      await this.jobsService.markDone(jobId, doneMsg);
      this.progressGateway.emitComplete(jobId, doneMsg);
    } catch (err) {
      await this.jobsService.markFailed(jobId, err.message);
      this.progressGateway.emitError(jobId, err.message);
      throw err;
    }
  }

  private async fetchPlayStoreReviews(url: string, limit: number, jobId: string): Promise<Partial<Review>[]> {
    const match = url.match(/[?&]id=([^&]+)/);
    if (!match) throw new Error(`Invalid Play Store URL. Please use a URL in the format: https://play.google.com/store/apps/details?id=com.example.app`);

    const androidAppId = match[1];
    const results: Partial<Review>[] = [];
    const pageSize = 150;
    const pagesNeeded = Math.ceil(limit / pageSize);
    let nextPaginationToken: string | undefined;

    for (let page = 0; page < pagesNeeded; page++) {
      const pct = 10 + Math.round(((page + 1) / pagesNeeded) * 40);
      await this.progress(jobId, `Fetching Play Store page ${page + 1} of ${pagesNeeded}...`, pct);

      const res: { data: any[]; nextPaginationToken?: string } = await (gplay as any).reviews({
        appId: androidAppId,
        sort: (gplay as any).sort?.NEWEST ?? 2,
        num: pageSize,
        paginate: true,
        nextPaginationToken,
        lang: 'en',
        country: 'us',
      });

      for (const r of res.data) {
        results.push({
          reviewerName: r.userName || 'Anonymous',
          rating: r.score || 3,
          reviewText: r.text || '',
          reviewDate: r.date ? new Date(r.date) : new Date(),
        });
      }

      nextPaginationToken = res.nextPaginationToken;
      if (!nextPaginationToken || results.length >= limit) break;
    }

    return results;
  }

  private async fetchAppStoreReviews(url: string, limit: number, jobId: string): Promise<Partial<Review>[]> {
    const match = url.match(/\/id(\d+)/);
    if (!match) throw new Error(`Could not extract app ID from App Store URL: ${url}`);

    const iosAppId = parseInt(match[1], 10);
    const results: Partial<Review>[] = [];
    const pagesNeeded = Math.min(Math.ceil(limit / 50), 10); // App Store returns ~50/page, max 10 pages

    for (let page = 1; page <= pagesNeeded; page++) {
      const pct = 60 + Math.round((page / pagesNeeded) * 18);
      await this.progress(jobId, `Fetching App Store page ${page} of ${pagesNeeded}...`, pct);

      const pageReviews = await store.reviews({
        id: iosAppId,
        sort: store.sort.RECENT,
        page,
        country: 'us',
      });

      for (const r of pageReviews) {
        results.push({
          reviewerName: r.userName || 'Anonymous',
          rating: r.score || 3,
          reviewText: r.text || '',
          reviewDate: r.updated ? new Date(r.updated) : new Date(),
        });
      }

      if (results.length >= limit) break;
    }

    return results;
  }
}
