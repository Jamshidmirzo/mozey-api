import { Module } from '@nestjs/common';
import { MuseumsController } from './museums.controller';
import {
  AdminMuseumsController,
  AdminMuseumPhotosController,
} from './admin-museums.controller';
import { MuseumsService } from './museums.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [MuseumsController, AdminMuseumsController, AdminMuseumPhotosController],
  providers: [MuseumsService],
  exports: [MuseumsService],
})
export class MuseumsModule {}
