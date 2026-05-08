import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddCompetitorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  playStoreLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appStoreLink?: string;

  @ApiProperty({ example: 'CompetitorApp' })
  @IsString()
  competitorAppName: string;
}
