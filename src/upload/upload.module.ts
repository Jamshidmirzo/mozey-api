import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { MAX_FILE_SIZE_BYTES } from '../common/constants';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => {
        // Ensure the local uploads directory exists before Multer tries to write to it.
        const dir = join(process.cwd(), 'public', 'uploads');
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        return {
          // We declare disk storage per-route via the FileInterceptor options.
          // Keep the global module config minimal so other features that may
          // mount file uploads in the future are not surprised.
          limits: {
            fileSize: MAX_FILE_SIZE_BYTES,
          },
        };
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
