import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsObject,
  ValidateNested,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MultilingualTextDto } from '../../museums/dto/create-museum.dto';

export class CreateRegionDto {
  @ApiProperty({ description: 'Region name in 3 languages' })
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  @IsObject()
  name: MultilingualTextDto;

  @ApiProperty({
    description: 'URL-friendly slug (lowercase, hyphens only)',
    example: 'xorazm',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiPropertyOptional({
    description: 'Display order (lower = first)',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIdx?: number;
}
