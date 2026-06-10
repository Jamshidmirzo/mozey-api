import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@ApiTags('Admin Users')
@ApiBearerAuth('admin-token')
@Controller('admin/admins')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
@Roles('superadmin')
export class AdminsController {
  constructor(
    private readonly adminsService: AdminsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all admin users (superadmin only)' })
  @ApiResponse({ status: 200, description: 'List of admins' })
  async findAll() {
    return this.adminsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new admin user (superadmin only)' })
  @ApiResponse({ status: 201, description: 'Admin created' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async create(
    @Body() dto: CreateAdminDto,
    @CurrentUser() admin: { id: string },
  ) {
    const newAdmin = await this.adminsService.create(dto);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'create_admin',
      entityType: 'admin',
      entityId: newAdmin.id,
      diff: { email: dto.email, role: dto.role },
    });

    return newAdmin;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an admin user (superadmin only)' })
  @ApiResponse({ status: 200, description: 'Admin deleted' })
  @ApiResponse({ status: 403, description: 'Cannot delete yourself' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: { id: string },
  ) {
    const result = await this.adminsService.remove(id, admin.id);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'delete_admin',
      entityType: 'admin',
      entityId: id,
      diff: null,
    });

    return result;
  }
}
