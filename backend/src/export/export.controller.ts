import { Controller, Get, Logger, Param, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ExportService } from './export.service';

@ApiTags('export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apps/:appId')
export class ExportController {
  private readonly logger = new Logger(ExportController.name);

  constructor(private readonly exportService: ExportService) {}

  @Get('analyses/latest/export-csv')
  @ApiOperation({ summary: 'Export latest analysis as CSV' })
  async exportAnalysisCsv(
    @Param('appId') appId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const csv = await this.exportService.generateAnalysisCsv(appId, req.user.id);
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="featurepulse-analysis.csv"`,
      });
      res.send('﻿' + csv); // BOM for Excel compatibility
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Analysis CSV export failed: ${message}`);
      res.status(500).json({ error: message });
    }
  }

  @Get('reviews/export-csv')
  @ApiOperation({ summary: 'Export all reviews as CSV' })
  async exportReviewsCsv(
    @Param('appId') appId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const csv = await this.exportService.generateReviewsCsv(appId, req.user.id);
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="featurepulse-reviews.csv"`,
      });
      res.send('﻿' + csv); // BOM for Excel compatibility
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Reviews CSV export failed: ${message}`);
      res.status(500).json({ error: message });
    }
  }
}
