import {
  BadRequestException,
  Controller,
  Post,
  Body,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  diskStorage,
  type MulterFile,
  type DiskStorageDestinationCallback,
  type DiskStorageFilenameCallback,
} from 'multer';
import { extname, basename, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { AdminJwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UploadService } from './upload.service';
import { PresignRequestDto } from './dto/presign-request.dto';
import { ALLOWED_IMAGE_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../common/constants';

const ALLOWED_MIME = new Set<string>(ALLOWED_IMAGE_MIME_TYPES);

// Minimal local Multer file shape — avoids pulling in @types/multer just for
// one decorator. Mirrors the public fields surfaced by multer's disk storage.
type UploadedDiskFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
};

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

  @Post('direct')
  @Roles('superadmin', 'editor')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({
    summary: 'Direct multipart upload (dev / fallback)',
    description:
      'Accepts a multipart/form-data upload, writes the file to ' +
      '`public/uploads/<uuid>-<filename>`, and returns the same `{ fileUrl, key }` ' +
      'shape as the presigned endpoint. Intended for local development when ' +
      'MinIO/S3 is not available, but stays usable in production as a fallback. ' +
      'Switch flow via the `UPLOAD_MODE` env var on the client.',
  })
  @ApiResponse({
    status: 201,
    description: 'File stored locally',
    schema: {
      properties: {
        fileUrl: { type: 'string' },
        key: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file or mime type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (
          _req: unknown,
          _file: MulterFile,
          cb: DiskStorageDestinationCallback,
        ) => {
          const dir = join(process.cwd(), 'public', 'uploads');
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (
          _req: unknown,
          file: MulterFile,
          cb: DiskStorageFilenameCallback,
        ) => {
          // Sanitize original name the same way we sanitize S3 keys.
          const safeBase = basename(file.originalname).replace(
            /[^a-zA-Z0-9._-]/g,
            '_',
          );
          const ext = extname(safeBase);
          const stem = safeBase.slice(0, safeBase.length - ext.length);
          cb(null, `${uuidv4()}-${stem}${ext}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (
        _req: unknown,
        file: MulterFile,
        cb: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        if (!ALLOWED_MIME.has(file.mimetype)) {
          // Returning an error here causes Multer to reject; Nest turns it
          // into a 400 via the global exception filter when we re-throw below.
          return cb(
            new BadRequestException(
              `Unsupported mime type: ${file.mimetype}. ` +
                `Allowed: ${[...ALLOWED_MIME].join(', ')}`,
            ) as unknown as Error,
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadDirect(@UploadedFile() file?: UploadedDiskFile) {
    if (!file) {
      throw new BadRequestException(
        'No file provided. Send the file in the "file" multipart field.',
      );
    }
    return this.uploadService.buildLocalUploadResult(file.filename);
  }
}
