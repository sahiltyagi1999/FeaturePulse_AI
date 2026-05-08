import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AppsModule } from './apps/apps.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AnalysisModule } from './analysis/analysis.module';
import { CompetitorModule } from './competitor/competitor.module';
import { ExportModule } from './export/export.module';
import { JobsModule } from './jobs/jobs.module';
import { QueueModule } from './queue/queue.module';
import { WebsocketModule } from './websocket/websocket.module';
import { User } from './auth/entities/user.entity';
import { App } from './apps/entities/app.entity';
import { Review } from './reviews/entities/review.entity';
import { Analysis } from './analysis/entities/analysis.entity';
import { Job } from './jobs/entities/job.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [User, App, Review, Analysis, Job],
        synchronize: true,
        logging: false,
        ssl: config.get('DATABASE_URL')?.includes('ssl') ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    AppsModule,
    ReviewsModule,
    AnalysisModule,
    CompetitorModule,
    ExportModule,
    JobsModule,
    QueueModule,
    WebsocketModule,
  ],
})
export class AppModule {}
