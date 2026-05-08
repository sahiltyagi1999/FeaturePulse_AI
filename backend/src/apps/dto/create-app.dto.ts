import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppDto {
  @ApiPropertyOptional({ example: 'https://play.google.com/store/apps/details?id=com.spotify.music' })
  @IsOptional()
  @IsString()
  playStoreLink?: string;

  @ApiPropertyOptional({ example: 'https://apps.apple.com/us/app/spotify/id324684580' })
  @IsOptional()
  @IsString()
  appStoreLink?: string;
}
