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
import { MuseumsService } from './museums.service';
import { CreateMuseumDto } from './dto/create-museum.dto';
import { UpdateMuseumDto } from './dto/update-museum.dto';
import { MuseumQueryDto } from './dto/museum-query.dto';
import {
  CreateMuseumLinkDto,
  UpdateMuseumLinkDto,
} from './dto/create-museum-link.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@ApiTags('Admin Museums')
@ApiBearerAuth('admin-token')
@Controller('admin/museums')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
export class AdminMuseumsController {
  constructor(
    private readonly museumsService: MuseumsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'List all museums (including unpublished)' })
  @ApiResponse({ status: 200, description: 'Paginated museum list' })
  async findAll(@Query() query: MuseumQueryDto) {
    return this.museumsService.adminFindAll(query);
  }

  @Get('cities')
  @Roles('superadmin', 'editor')
  @ApiOperation({
    summary: 'List distinct city values for autosuggest',
    description:
      'Returns sorted, distinct non-empty city strings used by existing museums. ' +
      'Pass ?regionId= to scope to a single region.',
  })
  @ApiResponse({ status: 200, description: 'Array of city names' })
  async listCities(@Query('regionId') regionId?: string) {
    return this.museumsService.listCities(regionId);
  }

  @Get(':id')
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Get a single museum (including unpublished)' })
  @ApiResponse({ status: 200, description: 'Museum details' })
  @ApiResponse({ status: 404, description: 'Museum not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.museumsService.adminFindOne(id);
  }

  @Post()
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Create a new museum' })
  @ApiResponse({ status: 201, description: 'Museum created' })
  @ApiResponse({ status: 409, description: 'Legacy ID already exists' })
  async create(
    @Body() dto: CreateMuseumDto,
    @CurrentUser() admin: { id: string },
  ) {
    const museum = await this.museumsService.create(dto);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'create',
      entityType: 'museum',
      entityId: museum.id,
      diff: dto as unknown as Record<string, unknown>,
    });

    return museum;
  }

  @Patch(':id')
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Update a museum' })
  @ApiResponse({ status: 200, description: 'Museum updated' })
  @ApiResponse({ status: 404, description: 'Museum not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMuseumDto,
    @CurrentUser() admin: { id: string },
  ) {
    const { museum, previousData } = await this.museumsService.update(id, dto);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'update',
      entityType: 'museum',
      entityId: museum.id,
      diff: {
        before: previousData,
        after: dto,
      },
    });

    return museum;
  }

  @Delete(':id')
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Soft-delete a museum' })
  @ApiResponse({ status: 200, description: 'Museum soft-deleted' })
  @ApiResponse({ status: 404, description: 'Museum not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: { id: string },
  ) {
    const result = await this.museumsService.softDelete(id);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'delete',
      entityType: 'museum',
      entityId: id,
      diff: null,
    });

    return result;
  }

  @Post(':id/photos')
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Add a photo to a museum' })
  @ApiResponse({ status: 201, description: 'Photo added' })
  @ApiResponse({ status: 404, description: 'Museum not found' })
  async addPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { url: string; orderIdx?: number },
    @CurrentUser() admin: { id: string },
  ) {
    const photo = await this.museumsService.addPhoto(
      id,
      body.url,
      body.orderIdx ?? 0,
    );

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'add_photo',
      entityType: 'museum',
      entityId: id,
      diff: { photoId: photo.id, url: body.url },
    });

    return photo;
  }

  @Post(':id/links')
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Add an external link to a museum' })
  @ApiResponse({ status: 201, description: 'Link added' })
  @ApiResponse({ status: 404, description: 'Museum not found' })
  async addLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMuseumLinkDto,
    @CurrentUser() admin: { id: string },
  ) {
    const link = await this.museumsService.addLink(id, dto);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'add_link',
      entityType: 'museum',
      entityId: id,
      diff: {
        linkId: link.id,
        url: dto.url,
        kind: dto.kind ?? 'website',
      },
    });

    return link;
  }
}

/**
 * Separate controller for museum link mutation (PATCH/DELETE /admin/links/:id).
 */
@ApiTags('Admin Museums')
@ApiBearerAuth('admin-token')
@Controller('admin/links')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
export class AdminMuseumLinksController {
  constructor(
    private readonly museumsService: MuseumsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Patch(':id')
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Update an external link' })
  @ApiResponse({ status: 200, description: 'Link updated' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  async updateLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMuseumLinkDto,
    @CurrentUser() admin: { id: string },
  ) {
    const link = await this.museumsService.updateLink(id, dto);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'update_link',
      entityType: 'museum_link',
      entityId: id,
      diff: dto as unknown as Record<string, unknown>,
    });

    return link;
  }

  @Delete(':id')
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Delete an external link' })
  @ApiResponse({ status: 200, description: 'Link deleted' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  async deleteLink(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: { id: string },
  ) {
    const result = await this.museumsService.deleteLink(id);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'delete_link',
      entityType: 'museum_link',
      entityId: id,
      diff: null,
    });

    return result;
  }
}

/**
 * Separate controller for photo deletion (DELETE /admin/photos/:id).
 * This is mounted at /admin/photos, not /admin/museums.
 */
@ApiTags('Admin Museums')
@ApiBearerAuth('admin-token')
@Controller('admin/photos')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
export class AdminMuseumPhotosController {
  constructor(
    private readonly museumsService: MuseumsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Delete(':id')
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Delete a museum photo' })
  @ApiResponse({ status: 200, description: 'Photo deleted' })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async deletePhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: { id: string },
  ) {
    const result = await this.museumsService.deletePhoto(id);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'delete_photo',
      entityType: 'museum_photo',
      entityId: id,
      diff: null,
    });

    return result;
  }
}
