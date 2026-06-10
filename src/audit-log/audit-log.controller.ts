import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditLogService } from './audit-log.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@ApiTags('Audit Log')
@ApiBearerAuth('admin-token')
@Controller('admin/audit-log')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles('superadmin')
  @ApiOperation({
    summary: 'List audit log entries',
    description:
      'Returns paginated audit log entries. Filterable by admin_id, entity_type, and action. Superadmin only.',
  })
  @ApiQuery({ name: 'adminId', required: false, description: 'Filter by admin UUID' })
  @ApiQuery({ name: 'entityType', required: false, description: 'Filter by entity type (museum, historical_place, etc.)' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action (create, update, delete, etc.)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated audit log entries' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — superadmin only' })
  async findAll(@Query() query: AuditLogQueryDto) {
    return this.auditLogService.findAll(query);
  }
}
