import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { Analysis } from '../analysis/entities/analysis.entity';
import { App } from '../apps/entities/app.entity';
import { Review } from '../reviews/entities/review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Analysis, App, Review])],
  providers: [ExportService],
  controllers: [ExportController],
})
export class ExportModule {}
