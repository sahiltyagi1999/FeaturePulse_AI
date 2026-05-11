import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { App } from '../apps/entities/app.entity';
import { JobType } from '../jobs/entities/job.entity';
import { JobsService } from '../jobs/jobs.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(App)
    private appRepository: Repository<App>,
    private jobsService: JobsService,
    private queueService: QueueService,
  ) {}

  async getFetchStatus(appId: string, userId: string) {
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException('App not found');
    if (app.userId !== userId) throw new ForbiddenException();

    const reviewCount = await this.reviewRepository.count({ where: { appId, isCompetitor: false } });

    return {
      lastFetchedAt: app.lastFetchedAt,
      reviewCount,
      message: app.lastFetchedAt
        ? `Last fetched on ${app.lastFetchedAt.toLocaleDateString()}. ${reviewCount} reviews in DB.`
        : `No reviews yet. Fetch now?`,
    };
  }

  async confirmFetch(appId: string, userId: string, options?: { limit?: number; startDate?: Date; endDate?: Date }) {
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException('App not found');
    if (app.userId !== userId) throw new ForbiddenException();

    const job = await this.jobsService.createJob(appId, JobType.FETCH_REVIEWS);
    await this.queueService.addReviewFetchJob({
      appId,
      jobId: job.id,
      limit: options?.limit ?? 100,
      startDate: options?.startDate?.toISOString(),
      endDate: options?.endDate?.toISOString(),
    });

    return { jobId: job.id };
  }

  async deleteAll(appId: string, userId: string) {
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException('App not found');
    if (app.userId !== userId) throw new ForbiddenException();

    await this.reviewRepository.delete({ appId, isCompetitor: false });
    await this.appRepository.update(appId, { totalReviews: 0, lastFetchedAt: null });

    return { message: 'All reviews deleted' };
  }

  async findAll(appId: string, userId: string, options: {
    page?: number;
    limit?: number;
    rating?: number;
    platform?: string;
    search?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException('App not found');
    if (app.userId !== userId) throw new ForbiddenException();

    const { page = 1, limit = 20, rating, platform, search, startDate, endDate } = options;
    const query = this.reviewRepository.createQueryBuilder('review')
      .where('review.appId = :appId AND review.isCompetitor = false', { appId });

    if (rating) query.andWhere('review.rating = :rating', { rating });
    if (platform) query.andWhere('review.platform = :platform', { platform });
    if (startDate) query.andWhere('review.reviewDate >= :startDate', { startDate });
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.andWhere('review.reviewDate <= :endDate', { endDate: end });
    }

    query.orderBy('review.reviewDate', 'DESC');
    query.skip((page - 1) * limit).take(limit);

    const [items, total] = await query.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
