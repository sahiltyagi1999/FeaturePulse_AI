import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus, JobType } from './entities/job.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async createJob(appId: string, jobType: JobType): Promise<Job> {
    const job = this.jobRepository.create({ appId, jobType, status: JobStatus.QUEUED });
    return this.jobRepository.save(job);
  }

  async findById(id: string): Promise<Job> {
    const job = await this.jobRepository.findOne({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async updateProgress(id: string, step: string, percent: number) {
    await this.jobRepository.update(id, {
      status: JobStatus.PROCESSING,
      progressStep: step,
      progressPercent: percent,
    });
  }

  async markDone(id: string, step: string) {
    await this.jobRepository.update(id, {
      status: JobStatus.DONE,
      progressStep: step,
      progressPercent: 100,
    });
  }

  async markFailed(id: string, error: string) {
    await this.jobRepository.update(id, {
      status: JobStatus.FAILED,
      error,
    });
  }
}
