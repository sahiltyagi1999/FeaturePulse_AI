import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Review, ReviewPlatform } from '../reviews/entities/review.entity';
import { App } from '../apps/entities/app.entity';
import { AddCompetitorDto } from './dto/add-competitor.dto';

@Injectable()
export class CompetitorService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(App)
    private appRepository: Repository<App>,
  ) {}

  async addCompetitor(appId: string, userId: string, dto: AddCompetitorDto) {
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException('App not found');
    if (app.userId !== userId) throw new ForbiddenException();

    const reviews: Partial<Review>[] = [];

    if (dto.playStoreLink) {
      const r = await this.fetchPlayStoreReviews(dto.playStoreLink);
      reviews.push(...r.map((rv) => ({
        ...rv,
        appId,
        platform: ReviewPlatform.ANDROID,
        isCompetitor: true,
        competitorAppName: dto.competitorAppName,
      })));
    }

    if (dto.appStoreLink) {
      const r = await this.fetchAppStoreReviews(dto.appStoreLink);
      reviews.push(...r.map((rv) => ({
        ...rv,
        appId,
        platform: ReviewPlatform.IOS,
        isCompetitor: true,
        competitorAppName: dto.competitorAppName,
      })));
    }

    if (reviews.length > 0) {
      await this.reviewRepository.save(reviews);
    }

    return {
      competitorAppName: dto.competitorAppName,
      reviewsFetched: reviews.length,
      message: `${reviews.length} competitor reviews added`,
    };
  }

  async getCompetitorAnalysis(appId: string, userId: string) {
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) throw new NotFoundException('App not found');
    if (app.userId !== userId) throw new ForbiddenException();

    const yourReviews = await this.reviewRepository.find({
      where: { appId, isCompetitor: false },
      take: 100,
    });

    const competitorReviews = await this.reviewRepository.find({
      where: { appId, isCompetitor: true },
      take: 100,
    });

    if (yourReviews.length === 0 || competitorReviews.length === 0) {
      return {
        message: 'Not enough data for comparison. Add competitor reviews first.',
        yourAppSentiment: { positive: 0, neutral: 0, negative: 0 },
        competitorSentiment: { positive: 0, neutral: 0, negative: 0 },
        featuresTheyHaveThatUsersWant: [],
        featuresYouHaveThatTheyLack: [],
        commonComplaints: [],
      };
    }

    const yourSentiment = this.calculateSentiment(yourReviews);
    const competitorSentiment = this.calculateSentiment(competitorReviews);

    return {
      yourAppSentiment: yourSentiment,
      competitorSentiment,
      featuresTheyHaveThatUsersWant: this.extractFeatureRequests(competitorReviews),
      featuresYouHaveThatTheyLack: this.extractPositiveFeatures(yourReviews),
      commonComplaints: this.findCommonComplaints(yourReviews, competitorReviews),
    };
  }

  private calculateSentiment(reviews: Review[]) {
    const pos = reviews.filter((r) => r.rating >= 4).length;
    const neg = reviews.filter((r) => r.rating <= 2).length;
    const total = reviews.length;
    return {
      positive: Math.round((pos / total) * 100),
      neutral: Math.round(((total - pos - neg) / total) * 100),
      negative: Math.round((neg / total) * 100),
    };
  }

  private extractFeatureRequests(reviews: Review[]): string[] {
    const keywords = ['wish', 'need', 'want', 'add', 'missing', 'should have', 'would be nice', 'please add'];
    return reviews
      .filter((r) => keywords.some((kw) => r.reviewText.toLowerCase().includes(kw)))
      .slice(0, 5)
      .map((r) => r.reviewText.slice(0, 100));
  }

  private extractPositiveFeatures(reviews: Review[]): string[] {
    return reviews
      .filter((r) => r.rating >= 4)
      .slice(0, 5)
      .map((r) => r.reviewText.slice(0, 100));
  }

  private findCommonComplaints(yourReviews: Review[], competitorReviews: Review[]): string[] {
    const negYours = yourReviews.filter((r) => r.rating <= 2).map((r) => r.reviewText.slice(0, 100));
    const negComp = competitorReviews.filter((r) => r.rating <= 2).map((r) => r.reviewText.slice(0, 100));
    return [...negYours.slice(0, 3), ...negComp.slice(0, 3)];
  }

  private async fetchPlayStoreReviews(url: string): Promise<Partial<Review>[]> {
    try {
      const match = url.match(/[?&]id=([^&]+)/);
      if (!match) return [];
      const appId = match[1];
      const response = await axios.post(
        'https://play.google.com/_/PlayStoreUi/data/batchexecute',
        `f.req=%5B%5B%5B%22UsvDTd%22%2C%22%5Bnull%2Cnull%2C%5B2%2C1%2C%5B40%2Cnull%2Cnull%5D%2Cnull%2C%5B%5D%5D%2C%5B%22${encodeURIComponent(appId)}%22%2C7%5D%5D%22%2Cnull%2C%22generic%22%5D%5D%5D`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 },
      );
      const jsonMatch = response.data.match(/\[\[.+\]\]/);
      if (!jsonMatch) return [];
      const parsed = JSON.parse(jsonMatch[0]);
      const reviews = parsed?.[0]?.[2]?.[0] || [];
      return reviews.slice(0, 30).map((r: any) => ({
        reviewerName: r?.[1]?.[0] || 'Anonymous',
        rating: r?.[2] || 3,
        reviewText: r?.[4] || '',
        reviewDate: r?.[5]?.[0] ? new Date(r[5][0] * 1000) : new Date(),
      }));
    } catch {
      return [];
    }
  }

  private async fetchAppStoreReviews(url: string): Promise<Partial<Review>[]> {
    try {
      const match = url.match(/\/id(\d+)/);
      if (!match) return [];
      const response = await axios.get(
        `https://itunes.apple.com/us/rss/customerreviews/id=${match[1]}/sortBy=mostRecent/json`,
        { timeout: 10000 },
      );
      const entries = response.data?.feed?.entry || [];
      return entries.slice(0, 30).map((entry: any) => ({
        reviewerName: entry.author?.name?.label || 'Anonymous',
        rating: parseInt(entry['im:rating']?.label || '3'),
        reviewText: entry.content?.label || '',
        reviewDate: entry.updated?.label ? new Date(entry.updated.label) : new Date(),
      }));
    } catch {
      return [];
    }
  }
}
