import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
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
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@ApiTags('Notifications')
@ApiBearerAuth('admin-token')
@Controller('admin/notifications')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
@Roles('superadmin', 'editor')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Send a push notification to all devices or a topic',
  })
  @ApiResponse({ status: 201, description: 'Notification sent' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async send(
    @Body() dto: CreateNotificationDto,
    @CurrentUser() admin: { id: string },
  ) {
    const result = await this.notificationsService.sendNotification(
      dto,
      admin.id,
    );

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'send_notification',
      entityType: 'notification',
      entityId: result.id,
      diff: {
        title: dto.title,
        body: dto.body,
        topic: dto.topic || null,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
      },
    });

    return result;
  }

  @Get()
  @ApiOperation({ summary: 'List sent notifications with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated notifications list' })
  async findAll(@Query() query: NotificationQueryDto) {
    return this.notificationsService.findAll(query);
  }
}
