import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analysis } from './entities/analysis.entity';
import { App } from '../apps/entities/app.entity';
import { JobType } from '../jobs/entities/job.entity';
import { JobsService } from '../jobs/jobs.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
    @InjectRepository(App)
    private appRepository: Repository<App>,
    private jobsService: JobsService,
    private queueService: QueueService,
  ) {}

  async queueAnalysis(appId: string, userId: string) {
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException('App not found');
    if (app.userId !== userId) throw new ForbiddenException();

    const job = await this.jobsService.createJob(appId, JobType.ANALYSE);
    await this.queueService.addAnalysisJob({ appId, jobId: job.id });

    return { jobId: job.id };
  }

  async findAll(appId: string, userId: string) {
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException('App not found');
    if (app.userId !== userId) throw new ForbiddenException();

    return this.analysisRepository.find({
      where: { appId },
      order: { generatedAt: 'DESC' },
    });
  }

  async findLatest(appId: string, userId: string) {
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException('App not found');
    if (app.userId !== userId) throw new ForbiddenException();

    return this.analysisRepository.findOne({
      where: { appId },
      order: { generatedAt: 'DESC' },
    });
  }
}
