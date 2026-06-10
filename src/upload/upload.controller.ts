import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UploadService } from './upload.service';
import { PresignRequestDto } from './dto/presign-request.dto';

@ApiTags('Upload')
@ApiBearerAuth('admin-token')
@Controller('admin/upload')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presign')
  @Roles('superadmin', 'editor')
  @ApiOperation({
    summary: 'Generate a presigned S3 upload URL',
    description:
      'Returns a presigned PUT URL for direct upload to S3-compatible storage. ' +
      'The URL expires in 15 minutes. After uploading, use the returned file_url ' +
      'when creating/updating museum or historical place photos.',
  })
  @ApiResponse({
    status: 201,
    description: 'Presigned URL generated',
    schema: {
      properties: {
        uploadUrl: {
          type: 'string',
          description: 'Presigned PUT URL (expires in 15 min)',
        },
        fileUrl: {
          type: 'string',
          description: 'Public URL of the file after upload',
        },
        key: {
          type: 'string',
          description: 'S3 object key',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid content type or missing fields' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async presign(@Body() dto: PresignRequestDto) {
    return this.uploadService.generatePresignedUrl(dto.filename, dto.contentType);
  }
}
