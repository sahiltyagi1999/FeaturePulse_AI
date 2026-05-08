import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitorService } from './competitor.service';
import { CompetitorController } from './competitor.controller';
import { Review } from '../reviews/entities/review.entity';
import { App } from '../apps/entities/app.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, App])],
  providers: [CompetitorService],
  controllers: [CompetitorController],
})
export class CompetitorModule {}
