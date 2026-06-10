import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class AuditLogQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by admin UUID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  adminId?: string;

  @ApiPropertyOptional({
    description: 'Filter by entity type (museum, historical_place, etc.)',
    example: 'museum',
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({
    description: 'Filter by action (create, update, delete, etc.)',
    example: 'update',
  })
  @IsOptional()
  @IsString()
  action?: string;
}
