import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Worker, Job } from 'bullmq';
import Anthropic from '@anthropic-ai/sdk';
import { Analysis } from '../../analysis/entities/analysis.entity';
import { Review } from '../../reviews/entities/review.entity';
import { App } from '../../apps/entities/app.entity';
import { JobsService } from '../../jobs/jobs.service';
import { ProgressGateway } from '../../websocket/progress.gateway';
import { createRedisConnection } from '../queue.service';

@Injectable()
export class AnalysisWorker implements OnModuleInit {
  private readonly logger = new Logger(AnalysisWorker.name);
  private anthropic: Anthropic;

  constructor(
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(App)
    private appRepository: Repository<App>,
    private jobsService: JobsService,
    private progressGateway: ProgressGateway,
  ) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  onModuleInit() {
    const conn = createRedisConnection();
    const worker = new Worker(
      'analysis',
      async (job: Job) => this.process(job),
      { connection: conn, concurrency: 1 },
    );

    worker.on('completed', (job) => this.logger.log(`Analysis job ${job.id} completed`));
    worker.on('failed', (job, err) => this.logger.error(`Analysis job ${job?.id} failed`, err.stack));
  }

  private async progress(jobId: string, step: string, percent: number) {
    await this.jobsService.updateProgress(jobId, step, percent);
    this.progressGateway.emitProgress(jobId, { step, percent });
  }

  private async process(job: Job) {
    const { appId, jobId } = job.data;

    try {
      await this.progress(jobId, 'Starting analysis...', 5);

      await this.progress(jobId, 'Loading app description from database...', 10);
      const app = await this.appRepository.findOne({ where: { id: appId } });
      if (!app) throw new Error('App not found');

      await this.progress(jobId, 'Loading reviews from database...', 20);
      const reviews = await this.reviewRepository.find({
        where: { appId, isCompetitor: false },
        order: { createdAt: 'DESC' },
        take: 200,
      });

      if (reviews.length === 0) {
        throw new Error('No reviews found. Please fetch reviews first.');
      }

      await this.progress(jobId, 'Preparing AI prompt...', 30);
      const reviewsText = reviews
        .slice(0, 150)
        .map((r) => `[Rating: ${r.rating}/5] "${r.reviewText}" — ${r.reviewerName || 'Anonymous'}, ${r.reviewDate ? new Date(r.reviewDate).toLocaleDateString() : 'Unknown date'}`)
        .join('\n');

      const prompt = this.buildPrompt(app, reviews.length, reviewsText);

      await this.progress(jobId, 'Sending to Claude AI...', 40);

      await this.progress(jobId, 'Claude is reading reviews...', 50);
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: 'You are a senior product strategist and UX researcher. Return ONLY valid JSON. No markdown. No explanation. No text outside the JSON.',
        messages: [{ role: 'user', content: prompt }],
      });

      await this.progress(jobId, 'Claude is identifying bugs and fixes...', 65);
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      await this.progress(jobId, 'Claude is generating feature ideas...', 78);
      let analysisData: any;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        analysisData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
      } catch {
        throw new Error('Failed to parse Claude response as JSON');
      }

      await this.progress(jobId, 'Claude is analysing competitor mentions...', 88);

      await this.progress(jobId, 'Saving analysis to database...', 95);
      const analysis = this.analysisRepository.create({
        appId,
        summary: analysisData.summary || '',
        prioritizedFixes: analysisData.prioritizedFixes || [],
        nextFeatureIdeas: analysisData.nextFeatureIdeas || [],
        competitorMentions: analysisData.competitorMentions || [],
        sentimentBreakdown: analysisData.sentimentBreakdown || { positive: 60, neutral: 20, negative: 20 },
        rawPromptUsed: prompt,
      });
      await this.analysisRepository.save(analysis);

      await this.jobsService.markDone(jobId, 'Analysis complete!');
      this.progressGateway.emitComplete(jobId, 'Analysis complete!');
    } catch (err) {
      await this.jobsService.markFailed(jobId, err.message);
      this.progressGateway.emitError(jobId, err.message);
      throw err;
    }
  }

  private buildPrompt(app: App, reviewCount: number, reviewsText: string): string {
    return `You are a senior product strategist and UX researcher.
Analyse the following mobile app reviews and return ONLY a valid JSON object.
No markdown. No explanation. No text outside the JSON.

APP NAME: ${app.appName}
APP DESCRIPTION: ${app.description || 'Not available'}
PLATFORM: ${app.platform}
AVERAGE RATING: ${app.averageRating || 'N/A'}/5
TOTAL REVIEWS: ${reviewCount}

REVIEWS:
${reviewsText}

Return this exact JSON structure:
{
  "summary": "2-3 sentence overview of overall user sentiment",

  "prioritizedFixes": [
    {
      "rank": 1,
      "issue": "Clear title of the bug or problem",
      "description": "What exactly is broken or frustrating users",
      "frequency": "Approximate % of reviews mentioning this",
      "severity": "critical | high | medium | low",
      "realWorldImpact": "What real user problem occurs if NOT fixed",
      "suggestedFix": "Concrete technical or UX suggestion",
      "supportingReviews": ["exact quote 1", "exact quote 2"]
    }
  ],

  "nextFeatureIdeas": [
    {
      "rank": 1,
      "featureName": "Short feature name",
      "description": "What this feature does",
      "userDemand": "high | medium | low",
      "whyValid": "Why this makes sense based on reviews and app purpose",
      "realWorldProblemIfNotAdded": "What users keep suffering without this",
      "implementationComplexity": "easy | medium | hard",
      "supportingReviews": ["exact quote 1", "exact quote 2"]
    }
  ],

  "competitorMentions": [
    {
      "competitorName": "Name of competitor mentioned",
      "context": "What users said about them",
      "threatLevel": "high | medium | low"
    }
  ],

  "sentimentBreakdown": {
    "positive": 60,
    "neutral": 20,
    "negative": 20
  }
}

Rules:
- Only suggest fixes based on actual review content, never hallucinate
- Rank by combination of frequency AND severity
- Include exact quotes as evidence for every fix and feature
- Be brutally honest, not diplomatic`;
  }
}
