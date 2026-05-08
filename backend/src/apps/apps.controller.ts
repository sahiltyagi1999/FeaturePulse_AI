import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AppsService } from './apps.service';
import { CreateAppDto } from './dto/create-app.dto';

@ApiTags('apps')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apps')
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new app by store link' })
  create(@Request() req: any, @Body() dto: CreateAppDto) {
    return this.appsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all apps for current user' })
  findAll(@Request() req: any) {
    return this.appsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get app details' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.appsService.findOne(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an app' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.appsService.delete(id, req.user.id);
  }

  @Post('scrape-preview')
  @ApiOperation({ summary: 'Preview scraped app info before saving' })
  scrapePreview(@Body() dto: CreateAppDto) {
    return this.appsService.scrapeAppInfo(dto);
  }
}
