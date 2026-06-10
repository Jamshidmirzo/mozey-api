import {
  IsOptional,
  IsNumber,
  IsString,
  IsObject,
  ValidateNested,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MultilingualTextDto } from '../../museums/dto/create-museum.dto';

export class UpdateRegionDto {
  @ApiPropertyOptional({ description: 'Region name in 3 languages' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  @IsObject()
  name?: MultilingualTextDto;

  @ApiPropertyOptional({
    description: 'URL-friendly slug (lowercase, hyphens only)',
    example: 'xorazm',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Display order (lower = first)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIdx?: number;
}
