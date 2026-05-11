import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analysis } from '../analysis/entities/analysis.entity';
import { App } from '../apps/entities/app.entity';
import { Review } from '../reviews/entities/review.entity';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
    @InjectRepository(App)
    private appRepository: Repository<App>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  private csvCell(value: any): string {
    const str = String(value ?? '').replace(/"/g, '""');
    return `"${str}"`;
  }

  private row(cells: any[]): string {
    return cells.map((c) => this.csvCell(c)).join(',');
  }

  async generateAnalysisCsv(appId: string, userId: string): Promise<string> {
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException('App not found');
    if (app.userId !== userId) throw new ForbiddenException();

    const analysis = await this.analysisRepository.findOne({
      where: { appId },
      order: { generatedAt: 'DESC' },
    });
    if (!analysis) throw new NotFoundException('No analysis found');

    const lines: string[] = [];

    // App info header
    lines.push(this.row(['App', 'Platform', 'Average Rating', 'Total Reviews', 'Analysis Date']));
    lines.push(this.row([
      app.appName,
      app.platform,
      app.averageRating ?? '',
      app.totalReviews,
      new Date(analysis.generatedAt).toISOString().split('T')[0],
    ]));
    lines.push('');

    // Summary
    lines.push(this.row(['SUMMARY']));
    lines.push(this.row([analysis.summary ?? '']));
    lines.push('');

    // Sentiment
    const s = analysis.sentimentBreakdown || { positive: 0, neutral: 0, negative: 0 };
    lines.push(this.row(['SENTIMENT', 'Positive %', 'Neutral %', 'Negative %']));
    lines.push(this.row(['', s.positive, s.neutral, s.negative]));
    lines.push('');

    // Prioritized fixes
    const fixes = analysis.prioritizedFixes || [];
    lines.push(this.row(['PRIORITIZED FIXES']));
    lines.push(this.row(['Rank', 'Issue', 'Severity', 'Frequency', 'Description', 'Real-World Impact', 'Suggested Fix', 'Supporting Quotes']));
    for (const fix of fixes) {
      lines.push(this.row([
        fix.rank,
        fix.issue,
        fix.severity,
        fix.frequency ?? '',
        fix.description,
        fix.realWorldImpact,
        fix.suggestedFix,
        (fix.supportingReviews ?? []).join(' | '),
      ]));
    }
    lines.push('');

    // Feature ideas
    const features = analysis.nextFeatureIdeas || [];
    lines.push(this.row(['FEATURE IDEAS']));
    lines.push(this.row(['Rank', 'Feature', 'User Demand', 'Complexity', 'Description', 'Why Valid', 'Impact if Not Added', 'Supporting Quotes']));
    for (const feat of features) {
      lines.push(this.row([
        feat.rank,
        feat.featureName,
        feat.userDemand,
        feat.implementationComplexity,
        feat.description,
        feat.whyValid,
        feat.realWorldProblemIfNotAdded,
        (feat.supportingReviews ?? []).join(' | '),
      ]));
    }
    lines.push('');

    // Competitor mentions
    const competitors = analysis.competitorMentions || [];
    if (competitors.length > 0) {
      lines.push(this.row(['COMPETITOR MENTIONS']));
      lines.push(this.row(['Competitor', 'Threat Level', 'Context']));
      for (const c of competitors) {
        lines.push(this.row([c.competitorName, c.threatLevel, c.context]));
      }
    }

    return lines.join('\n');
  }

  async generateReviewsCsv(appId: string, userId: string): Promise<string> {
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException('App not found');
    if (app.userId !== userId) throw new ForbiddenException();

    const reviews = await this.reviewRepository.find({
      where: { appId, isCompetitor: false },
      order: { reviewDate: 'DESC' },
    });

    const lines: string[] = [];
    lines.push(this.row(['Reviewer', 'Rating', 'Platform', 'Review Date', 'Review Text']));
    for (const r of reviews) {
      lines.push(this.row([
        r.reviewerName || 'Anonymous',
        r.rating,
        r.platform,
        r.reviewDate ? new Date(r.reviewDate).toISOString().split('T')[0] : '',
        r.reviewText,
      ]));
    }

    return lines.join('\n');
  }
}
