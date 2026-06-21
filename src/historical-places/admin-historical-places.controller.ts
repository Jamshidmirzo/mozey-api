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
import { HistoricalPlacesService } from './historical-places.service';
import { CreateHistoricalPlaceDto } from './dto/create-historical-place.dto';
import { UpdateHistoricalPlaceDto } from './dto/update-historical-place.dto';
import { HistoricalPlaceQueryDto } from './dto/historical-place-query.dto';
import { AddPhotoDto } from '../common/dto/add-photo.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@ApiTags('Admin Historical Places')
@ApiBearerAuth('admin-token')
@Controller('admin/historical-places')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
export class AdminHistoricalPlacesController {
  constructor(
    private readonly historicalPlacesService: HistoricalPlacesService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'List all historical places (including unpublished)' })
  @ApiResponse({ status: 200, description: 'Paginated list' })
  async findAll(@Query() query: HistoricalPlaceQueryDto) {
    return this.historicalPlacesService.adminFindAll(query);
  }

  @Get(':id')
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Get a single historical place (including unpublished)' })
  @ApiResponse({ status: 200, description: 'Place details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.historicalPlacesService.adminFindOne(id);
  }

  @Post()
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Create a new historical place' })
  @ApiResponse({ status: 201, description: 'Place created' })
  @ApiResponse({ status: 409, description: 'Legacy ID already exists' })
  async create(
    @Body() dto: CreateHistoricalPlaceDto,
    @CurrentUser() admin: { id: string },
  ) {
    const place = await this.historicalPlacesService.create(dto);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'create',
      entityType: 'historical_place',
      entityId: place.id,
      diff: dto as unknown as Record<string, unknown>,
    });

    return place;
  }

  @Patch(':id')
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Update a historical place' })
  @ApiResponse({ status: 200, description: 'Place updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHistoricalPlaceDto,
    @CurrentUser() admin: { id: string },
  ) {
    const { place, previousData } = await this.historicalPlacesService.update(
      id,
      dto,
    );

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'update',
      entityType: 'historical_place',
      entityId: place.id,
      diff: {
        before: previousData,
        after: dto,
      },
    });

    return place;
  }

  @Delete(':id')
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Soft-delete a historical place' })
  @ApiResponse({ status: 200, description: 'Place soft-deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: { id: string },
  ) {
    const result = await this.historicalPlacesService.softDelete(id);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'delete',
      entityType: 'historical_place',
      entityId: id,
      diff: null,
    });

    return result;
  }

  @Post(':id/photos')
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Add a photo to a historical place' })
  @ApiResponse({ status: 201, description: 'Photo added' })
  @ApiResponse({ status: 404, description: 'Place not found' })
  async addPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddPhotoDto,
    @CurrentUser() admin: { id: string },
  ) {
    const photo = await this.historicalPlacesService.addPhoto(
      id,
      dto.url,
      dto.orderIdx ?? 0,
    );

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'add_photo',
      entityType: 'historical_place',
      entityId: id,
      diff: { photoId: photo.id, url: dto.url },
    });

    return photo;
  }
}

/**
 * Separate controller for historical place photo deletion.
 */
@ApiTags('Admin Historical Places')
@ApiBearerAuth('admin-token')
@Controller('admin/historical-place-photos')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
export class AdminHistoricalPlacePhotosController {
  constructor(
    private readonly historicalPlacesService: HistoricalPlacesService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Delete(':id')
  @Roles('superadmin', 'editor')
  @ApiOperation({ summary: 'Delete a historical place photo' })
  @ApiResponse({ status: 200, description: 'Photo deleted' })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async deletePhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: { id: string },
  ) {
    const result = await this.historicalPlacesService.deletePhoto(id);

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'delete_photo',
      entityType: 'historical_place_photo',
      entityId: id,
      diff: null,
    });

    return result;
  }
}
