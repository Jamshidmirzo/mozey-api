import { IsOptional, IsString, IsDateString, IsIn, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class HistoricalPlaceQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'ISO 8601 timestamp — returns only items updated after this date (delta sync)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  since?: string;

  @ApiPropertyOptional({
    description: 'Filter by city name',
    example: 'Samarkand',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Search text (matches name in any language)',
    example: 'Registan',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by region UUID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status: published, draft, or deleted',
    enum: ['published', 'draft', 'deleted'],
  })
  @IsOptional()
  @IsIn(['published', 'draft', 'deleted'])
  status?: 'published' | 'draft' | 'deleted';
}
