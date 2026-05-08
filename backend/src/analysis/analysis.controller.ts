import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AnalysisService } from './analysis.service';

@ApiTags('analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apps/:appId')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('analyse')
  @ApiOperation({ summary: 'Queue an AI analysis job' })
  queueAnalysis(@Param('appId') appId: string, @Request() req: any) {
    return this.analysisService.queueAnalysis(appId, req.user.id);
  }

  @Get('analyses')
  @ApiOperation({ summary: 'List all analyses for this app' })
  findAll(@Param('appId') appId: string, @Request() req: any) {
    return this.analysisService.findAll(appId, req.user.id);
  }

  @Get('analyses/latest')
  @ApiOperation({ summary: 'Get latest analysis' })
  findLatest(@Param('appId') appId: string, @Request() req: any) {
    return this.analysisService.findLatest(appId, req.user.id);
  }
}
