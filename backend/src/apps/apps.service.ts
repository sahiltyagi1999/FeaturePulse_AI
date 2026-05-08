import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { App, Platform } from './entities/app.entity';
import { CreateAppDto } from './dto/create-app.dto';

@Injectable()
export class AppsService {
  private readonly logger = new Logger(AppsService.name);

  constructor(
    @InjectRepository(App)
    private appRepository: Repository<App>,
  ) {}

  async scrapeAppInfo(dto: CreateAppDto): Promise<Partial<App>> {
    let appName = 'Unknown App';
    let description = '';
    let iconUrl = '';
    let averageRating = null;
    let platform = Platform.BOTH;

    if (dto.playStoreLink) {
      try {
        const info = await this.scrapePlayStore(dto.playStoreLink);
        appName = info.appName || appName;
        description = info.description || description;
        iconUrl = info.iconUrl || iconUrl;
        averageRating = info.averageRating || averageRating;
      } catch (e) {
        this.logger.warn(`Play Store scrape failed: ${e.message}`);
      }
    }

    if (dto.appStoreLink && !dto.playStoreLink) {
      try {
        const info = await this.scrapeAppStore(dto.appStoreLink);
        appName = info.appName || appName;
        description = info.description || description;
        iconUrl = info.iconUrl || iconUrl;
        averageRating = info.averageRating || averageRating;
      } catch (e) {
        this.logger.warn(`App Store scrape failed: ${e.message}`);
      }
    }

    if (dto.playStoreLink && !dto.appStoreLink) platform = Platform.ANDROID;
    else if (!dto.playStoreLink && dto.appStoreLink) platform = Platform.IOS;
    else platform = Platform.BOTH;

    return { appName, description, iconUrl, averageRating, platform };
  }

  private async scrapePlayStore(url: string) {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000,
    });
    const $ = cheerio.load(response.data);

    const appName =
      $('h1[itemprop="name"]').text().trim() ||
      $('h1').first().text().trim() ||
      'Unknown';

    const description =
      $('[data-g-id="description"]').text().trim().slice(0, 500) ||
      $('meta[name="description"]').attr('content') ||
      '';

    const iconUrl =
      $('img[alt="Icon image"]').attr('src') ||
      $('img[itemprop="image"]').attr('src') ||
      '';

    const ratingText = $('div[itemprop="starRating"] meta[itemprop="ratingValue"]').attr('content') || '';
    const averageRating = ratingText ? parseFloat(ratingText) : null;

    return { appName, description, iconUrl, averageRating };
  }

  private async scrapeAppStore(url: string) {
    const match = url.match(/\/id(\d+)/);
    if (!match) return {};
    const appId = match[1];

    const response = await axios.get(
      `https://itunes.apple.com/lookup?id=${appId}&country=us`,
      { timeout: 10000 },
    );

    const result = response.data?.results?.[0];
    if (!result) return {};

    return {
      appName: result.trackName || 'Unknown',
      description: (result.description || '').slice(0, 500),
      iconUrl: result.artworkUrl512 || result.artworkUrl100 || '',
      averageRating: result.averageUserRating || null,
    };
  }

  async create(userId: string, dto: CreateAppDto): Promise<App> {
    if (!dto.playStoreLink && !dto.appStoreLink) {
      throw new BadRequestException('Provide at least one store link');
    }
    const scraped = await this.scrapeAppInfo(dto);
    const app = this.appRepository.create({
      userId,
      playStoreLink: dto.playStoreLink,
      appStoreLink: dto.appStoreLink,
      ...scraped,
    });
    return this.appRepository.save(app);
  }

  async findAll(userId: string): Promise<App[]> {
    return this.appRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<App> {
    const app = await this.appRepository.findOne({ where: { id } });
    if (!app) throw new NotFoundException('App not found');
    if (app.userId !== userId) throw new ForbiddenException();
    return app;
  }

  async delete(id: string, userId: string): Promise<void> {
    const app = await this.findOne(id, userId);
    await this.appRepository.remove(app);
  }

  async updateStats(id: string, totalReviews: number, lastFetchedAt: Date) {
    await this.appRepository.update(id, { totalReviews, lastFetchedAt });
  }
}
