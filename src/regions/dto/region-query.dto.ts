import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RegionQueryDto {
  @ApiPropertyOptional({
    description: 'Search text (matches name in any language)',
    example: 'Xorazm',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
