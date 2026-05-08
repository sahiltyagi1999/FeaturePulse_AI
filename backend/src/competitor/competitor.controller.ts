import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CompetitorService } from './competitor.service';
import { AddCompetitorDto } from './dto/add-competitor.dto';

@ApiTags('competitor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apps/:appId')
export class CompetitorController {
  constructor(private readonly competitorService: CompetitorService) {}

  @Post('competitor')
  @ApiOperation({ summary: 'Add competitor app and fetch their reviews' })
  addCompetitor(
    @Param('appId') appId: string,
    @Request() req: any,
    @Body() dto: AddCompetitorDto,
  ) {
    return this.competitorService.addCompetitor(appId, req.user.id, dto);
  }

  @Get('competitor-analysis')
  @ApiOperation({ summary: 'Get competitor comparison analysis' })
  getCompetitorAnalysis(@Param('appId') appId: string, @Request() req: any) {
    return this.competitorService.getCompetitorAnalysis(appId, req.user.id);
  }
}
