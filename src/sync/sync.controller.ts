import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AppJwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SyncService } from './sync.service';
import { SyncActionsDto } from './dto/sync-actions.dto';

@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('actions')
  @UseGuards(AppJwtAuthGuard)
  @ApiBearerAuth('app-token')
  @ApiOperation({
    summary: 'Batch upload user actions',
    description:
      'Upload like/unlike/save/unsave events from the client. ' +
      'Duplicates (same client_event_id) are silently skipped for idempotency.',
  })
  @ApiResponse({
    status: 201,
    description: 'Actions processed',
    schema: {
      properties: {
        accepted: { type: 'number' },
        duplicates: { type: 'number' },
        failed: { type: 'number' },
      },
    },
  })
  async syncActions(
    @Body() dto: SyncActionsDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.syncService.syncActions(userId, dto);
  }

  @Get('manifest')
  @ApiOperation({
    summary: 'Get sync manifest',
    description:
      'Returns hashes and updated_at for all published entities. ' +
      'Client can compare hashes to decide what needs updating.',
  })
  @ApiResponse({ status: 200, description: 'Sync manifest' })
  async getManifest() {
    return this.syncService.getManifest();
  }
}
