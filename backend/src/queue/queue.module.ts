import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewFetchWorker } from './workers/review-fetch.worker';
import { AnalysisWorker } from './workers/analysis.worker';
import { QueueService } from './queue.service';
import { Review } from '../reviews/entities/review.entity';
import { App } from '../apps/entities/app.entity';
import { Analysis } from '../analysis/entities/analysis.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, App, Analysis])],
  providers: [QueueService, ReviewFetchWorker, AnalysisWorker],
  exports: [QueueService],
})
export class QueueModule {}
