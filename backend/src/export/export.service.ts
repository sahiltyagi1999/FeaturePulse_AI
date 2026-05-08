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

  private escapeHtml(value: any): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async generatePdfHtml(appId: string, userId: string): Promise<string> {
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException('App not found');
    if (app.userId !== userId) throw new ForbiddenException();

    const analysis = await this.analysisRepository.findOne({
      where: { appId },
      order: { generatedAt: 'DESC' },
    });
    if (!analysis) throw new NotFoundException('No analysis found');

    const sentiment = analysis.sentimentBreakdown || { positive: 60, neutral: 20, negative: 20 };
    const fixes = analysis.prioritizedFixes || [];
    const features = analysis.nextFeatureIdeas || [];
    const competitors = analysis.competitorMentions || [];
    const generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const severityColor = (s: string) => {
      if (s === 'critical') return '#dc2626';
      if (s === 'high') return '#ea580c';
      if (s === 'medium') return '#ca8a04';
      return '#6b7280';
    };

    const demandColor = (d: string) => {
      if (d === 'high') return '#16a34a';
      if (d === 'medium') return '#2563eb';
      return '#6b7280';
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${this.escapeHtml(app.appName)} — FeaturePulse AI Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: #fff; padding: 40px; }
    .header { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
    .header img { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; }
    .header-text h1 { font-size: 24px; font-weight: 700; color: #111827; }
    .header-text p { color: #6b7280; font-size: 14px; margin-top: 4px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; color: white; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
    .summary-box { background: #f9fafb; border-left: 4px solid #6366f1; padding: 16px; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.6; color: #374151; }
    .sentiment { display: flex; gap: 20px; margin-bottom: 20px; }
    .sentiment-item { flex: 1; text-align: center; padding: 16px; border-radius: 8px; }
    .sentiment-item.positive { background: #dcfce7; }
    .sentiment-item.neutral { background: #f3f4f6; }
    .sentiment-item.negative { background: #fee2e2; }
    .sentiment-item .num { font-size: 32px; font-weight: 700; }
    .sentiment-item .label { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .fix-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .fix-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .rank { width: 28px; height: 28px; border-radius: 50%; background: #6366f1; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
    .fix-title { font-weight: 600; font-size: 15px; }
    .fix-body { font-size: 13px; color: #374151; line-height: 1.5; }
    .fix-body .label { font-weight: 600; color: #111827; margin-top: 8px; margin-bottom: 2px; }
    .quote { font-style: italic; color: #6b7280; font-size: 12px; padding: 6px 10px; background: #f9fafb; border-radius: 4px; margin-top: 4px; }
    .feature-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .competitor-item { padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; }
    .footer { margin-top: 48px; text-align: center; color: #9ca3af; font-size: 12px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .meta-item { background: #f9fafb; padding: 12px; border-radius: 8px; }
    .meta-item .meta-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .meta-item .meta-value { font-size: 18px; font-weight: 700; color: #111827; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="header">
    ${app.iconUrl ? `<img src="${this.escapeHtml(app.iconUrl)}" alt="${this.escapeHtml(app.appName)}" />` : `<div style="width:64px;height:64px;background:#6366f1;border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:700;">${this.escapeHtml(app.appName.charAt(0))}</div>`}
    <div class="header-text">
      <h1>${this.escapeHtml(app.appName)}</h1>
      <p>Analysis Report • Generated ${generatedDate}</p>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <div class="meta-label">Average Rating</div>
      <div class="meta-value">${app.averageRating ? Number(app.averageRating).toFixed(1) + ' / 5' : 'N/A'}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Total Reviews</div>
      <div class="meta-value">${app.totalReviews.toLocaleString()}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Platform</div>
      <div class="meta-value" style="text-transform:capitalize;">${this.escapeHtml(app.platform)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Executive Summary</div>
    <div class="summary-box">${this.escapeHtml(analysis.summary || 'No summary available.')}</div>
  </div>

  <div class="section">
    <div class="section-title">Sentiment Breakdown</div>
    <div class="sentiment">
      <div class="sentiment-item positive">
        <div class="num" style="color:#16a34a;">${sentiment.positive}%</div>
        <div class="label">Positive</div>
      </div>
      <div class="sentiment-item neutral">
        <div class="num" style="color:#374151;">${sentiment.neutral}%</div>
        <div class="label">Neutral</div>
      </div>
      <div class="sentiment-item negative">
        <div class="num" style="color:#dc2626;">${sentiment.negative}%</div>
        <div class="label">Negative</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Prioritized Fixes (${fixes.length})</div>
    ${fixes.map((fix: any) => `
    <div class="fix-card">
      <div class="fix-header">
        <div class="rank">${fix.rank}</div>
        <div class="fix-title">${this.escapeHtml(fix.issue)}</div>
        <span class="badge" style="background:${severityColor(fix.severity)};margin-left:auto;">${this.escapeHtml(fix.severity)}</span>
      </div>
      <div class="fix-body">
        <div class="label">Problem</div>
        <div>${this.escapeHtml(fix.description)}</div>
        <div class="label">Real-World Impact</div>
        <div>${this.escapeHtml(fix.realWorldImpact)}</div>
        <div class="label">Suggested Fix</div>
        <div>${this.escapeHtml(fix.suggestedFix)}</div>
        ${fix.supportingReviews?.map((q: string) => `<div class="quote">"${this.escapeHtml(q)}"</div>`).join('') || ''}
      </div>
    </div>
    `).join('')}
  </div>

  <div class="section">
    <div class="section-title">Feature Ideas (${features.length})</div>
    ${features.map((feat: any) => `
    <div class="feature-card">
      <div class="fix-header">
        <div class="rank" style="background:#10b981;">${feat.rank}</div>
        <div class="fix-title">${this.escapeHtml(feat.featureName)}</div>
        <span class="badge" style="background:${demandColor(feat.userDemand)};margin-left:auto;">${this.escapeHtml(feat.userDemand)} demand</span>
      </div>
      <div class="fix-body">
        <div class="label">Description</div>
        <div>${this.escapeHtml(feat.description)}</div>
        <div class="label">Why Valid</div>
        <div>${this.escapeHtml(feat.whyValid)}</div>
        <div class="label">Impact if Not Added</div>
        <div>${this.escapeHtml(feat.realWorldProblemIfNotAdded)}</div>
        ${feat.supportingReviews?.map((q: string) => `<div class="quote">"${this.escapeHtml(q)}"</div>`).join('') || ''}
      </div>
    </div>
    `).join('')}
  </div>

  ${competitors.length > 0 ? `
  <div class="section">
    <div class="section-title">Competitor Mentions (${competitors.length})</div>
    ${competitors.map((c: any) => `
    <div class="competitor-item">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <strong>${this.escapeHtml(c.competitorName)}</strong>
        <span class="badge" style="background:${c.threatLevel === 'high' ? '#dc2626' : c.threatLevel === 'medium' ? '#ea580c' : '#6b7280'}">${this.escapeHtml(c.threatLevel)} threat</span>
      </div>
      <div style="font-size:13px;color:#374151;margin-top:6px;">${this.escapeHtml(c.context)}</div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="footer">
    Generated by <strong>FeaturePulse AI</strong> • ${new Date().toISOString()}
  </div>
</body>
</html>`;
    return html;
  }

  async generateReviewsPdfHtml(appId: string, userId: string): Promise<string> {
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException('App not found');
    if (app.userId !== userId) throw new ForbiddenException();

    const reviews = await this.reviewRepository.find({
      where: { appId, isCompetitor: false },
      order: { rating: 'DESC', reviewDate: 'DESC', createdAt: 'DESC' },
    });

    const grouped = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      reviews: reviews.filter((review) => review.rating === rating),
    }));

    const stars = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating);
    const generated = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${this.escapeHtml(app.appName)} — Reviews Export</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 34px;
      color: #171513;
      background: #fbf5ea;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .masthead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      border-bottom: 2px solid #171513;
      padding-bottom: 18px;
      margin-bottom: 28px;
    }
    .brand { font-family: Georgia, "Times New Roman", serif; font-size: 34px; letter-spacing: -0.06em; }
    .kicker { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: #746b5e; font-weight: 800; }
    .app {
      display: flex;
      gap: 14px;
      align-items: center;
      margin-bottom: 24px;
    }
    .icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      border: 1px solid #d7c8ad;
      object-fit: cover;
      background: #f1e7d7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 28px;
    }
    h1 { font-size: 24px; margin: 0 0 4px; }
    .meta { color: #746b5e; font-size: 13px; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      border: 1px solid #d7c8ad;
      border-radius: 14px;
      overflow: hidden;
      margin-bottom: 28px;
      background: #f8f0e3;
    }
    .summary-item { padding: 14px; border-right: 1px solid #d7c8ad; }
    .summary-item:last-child { border-right: 0; }
    .summary-value { font-family: Georgia, "Times New Roman", serif; font-size: 28px; margin-top: 4px; }
    .group { break-inside: avoid; margin-bottom: 28px; }
    .group-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      border-bottom: 1px solid #d7c8ad;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .group-title { font-family: Georgia, "Times New Roman", serif; font-size: 26px; }
    .count { color: #746b5e; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    .review {
      border: 1px solid #d7c8ad;
      border-radius: 12px;
      background: #fffaf1;
      padding: 12px;
      margin-bottom: 10px;
      break-inside: avoid;
    }
    .review-top {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 8px;
      font-size: 12px;
      color: #746b5e;
    }
    .reviewer { color: #171513; font-weight: 800; }
    .stars { color: #c85f43; letter-spacing: .03em; }
    .text { font-size: 13px; line-height: 1.55; color: #342c24; white-space: pre-wrap; }
    .empty { color: #746b5e; font-size: 13px; padding: 8px 0; }
  </style>
</head>
<body>
  <div class="masthead">
    <div class="brand">FeaturePulse</div>
    <div class="kicker">Reviews classified by stars</div>
  </div>

  <div class="app">
    ${app.iconUrl ? `<img class="icon" src="${this.escapeHtml(app.iconUrl)}" />` : `<div class="icon">${this.escapeHtml(app.appName.charAt(0))}</div>`}
    <div>
      <h1>${this.escapeHtml(app.appName)}</h1>
      <div class="meta">Generated ${generated} • ${reviews.length.toLocaleString()} reviews • ${this.escapeHtml(app.platform)}</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-item"><div class="kicker">Average rating</div><div class="summary-value">${app.averageRating ? Number(app.averageRating).toFixed(1) : 'N/A'}</div></div>
    <div class="summary-item"><div class="kicker">Total reviews</div><div class="summary-value">${reviews.length.toLocaleString()}</div></div>
    <div class="summary-item"><div class="kicker">Last fetched</div><div class="summary-value" style="font-size:20px;">${app.lastFetchedAt ? new Date(app.lastFetchedAt).toLocaleDateString() : 'Never'}</div></div>
  </div>

  ${grouped.map((group) => `
    <section class="group">
      <div class="group-head">
        <div class="group-title">${group.rating} Star Reviews</div>
        <div class="count">${group.reviews.length} review${group.reviews.length === 1 ? '' : 's'}</div>
      </div>
      ${group.reviews.length ? group.reviews.map((review) => `
        <article class="review">
          <div class="review-top">
            <div><span class="reviewer">${this.escapeHtml(review.reviewerName || 'Anonymous')}</span> • ${this.escapeHtml(review.platform)}</div>
            <div>${review.reviewDate ? new Date(review.reviewDate).toLocaleDateString() : ''} <span class="stars">${stars(review.rating)}</span></div>
          </div>
          <div class="text">${this.escapeHtml(review.reviewText)}</div>
        </article>
      `).join('') : `<div class="empty">No ${group.rating}-star reviews found.</div>`}
    </section>
  `).join('')}
</body>
</html>`;
  }
}
