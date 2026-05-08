import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apps/:appId')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('fetch-reviews')
  @ApiOperation({ summary: 'Get fetch status info before confirming' })
  getFetchStatus(@Param('appId') appId: string, @Request() req: any) {
    return this.reviewsService.getFetchStatus(appId, req.user.id);
  }

  @Post('fetch-reviews/confirm')
  @ApiOperation({ summary: 'Confirm and queue a review fetch job' })
  confirmFetch(
    @Param('appId') appId: string,
    @Request() req: any,
    @Body() body: { limit?: number; startDate?: string; endDate?: string },
  ) {
    return this.reviewsService.confirmFetch(appId, req.user.id, {
      limit: body?.limit,
      startDate: body?.startDate ? new Date(body.startDate) : undefined,
      endDate: body?.endDate ? new Date(body.endDate) : undefined,
    });
  }

  @Delete('reviews')
  @ApiOperation({ summary: 'Delete all reviews for this app' })
  deleteAll(@Param('appId') appId: string, @Request() req: any) {
    return this.reviewsService.deleteAll(appId, req.user.id);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'List reviews (paginated, filterable)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'rating', required: false })
  @ApiQuery({ name: 'platform', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(
    @Param('appId') appId: string,
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('rating') rating?: number,
    @Query('platform') platform?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reviewsService.findAll(appId, req.user.id, {
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
      rating: rating ? +rating : undefined,
      platform,
      search,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }
}
