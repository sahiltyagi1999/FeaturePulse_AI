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

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  private async renderPdf(html: string): Promise<Buffer> {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      return page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      });
    } finally {
      await browser.close();
    }
  }

  @Get('analyses/latest/export-pdf')
  @ApiOperation({ summary: 'Export latest analysis as PDF' })
  async exportPdf(
    @Param('appId') appId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const html = await this.exportService.generatePdfHtml(appId, req.user.id);
      const pdfBuffer = await this.renderPdf(html);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="featurepulse-report.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      res.end(pdfBuffer);
    } catch (err) {
      const message = this.getErrorMessage(err);
      this.logger.error(`Analysis PDF generation failed: ${message}`);
      res.status(500).json({ error: `PDF generation failed: ${message}` });
    }
  }

  @Get('reviews/export-pdf')
  @ApiOperation({ summary: 'Export app reviews as PDF grouped by star rating' })
  async exportReviewsPdf(
    @Param('appId') appId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const html = await this.exportService.generateReviewsPdfHtml(appId, req.user.id);
      const pdfBuffer = await this.renderPdf(html);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="featurepulse-reviews-by-stars.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      res.end(pdfBuffer);
    } catch (err) {
      const message = this.getErrorMessage(err);
      this.logger.error(`Reviews PDF generation failed: ${message}`);
      res.status(500).json({ error: `Reviews PDF generation failed: ${message}` });
    }
  }
}
