import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { RegionQueryDto } from './dto/region-query.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@ApiTags('Admin Regions')
@ApiBearerAuth('admin-token')
@Controller('admin/regions')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
export class AdminRegionsController {
  constructor(
    private readonly regionsService: RegionsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'List all regions (admin)' })
  @ApiResponse({ status: 200, description: 'Region list with counts' })
  async findAll(@Query() query: RegionQueryDto) {
    return this.regionsService.adminFindAll(query);
  }

  @Get('dropdown')
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Get compact region list for dropdowns' })
  @ApiResponse({ status: 200, description: 'Compact region list' })
  async getDropdown() {
    return this.regionsService.getDropdownList();
  }

  @Get(':id')
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Get a single region (admin)' })
  @ApiResponse({ status: 200, description: 'Region details' })
  @ApiResponse({ status: 404, description: 'Region not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.regionsService.adminFindOne(id);
  }

  @Post()
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Create a new region' })
  @ApiResponse({ status: 201, description: 'Region created' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async create(
    @Body() dto: CreateRegionDto,
    @CurrentUser() admin: { id: string },
  ) {
    const region = await this.regionsService.create(dto);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'create',
      entityType: 'region',
      entityId: region.id,
      diff: dto as unknown as Record<string, unknown>,
    });

    return region;
  }

  @Patch(':id')
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Update a region' })
  @ApiResponse({ status: 200, description: 'Region updated' })
  @ApiResponse({ status: 404, description: 'Region not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRegionDto,
    @CurrentUser() admin: { id: string },
  ) {
    const { region, previousData } = await this.regionsService.update(id, dto);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'update',
      entityType: 'region',
      entityId: region.id,
      diff: {
        before: previousData,
        after: dto,
      },
    });

    return region;
  }

  @Delete(':id')
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Soft-delete a region' })
  @ApiResponse({ status: 200, description: 'Region soft-deleted' })
  @ApiResponse({ status: 404, description: 'Region not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: { id: string },
  ) {
    const result = await this.regionsService.softDelete(id);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'delete',
      entityType: 'region',
      entityId: id,
      diff: null,
    });

    return result;
  }
}
