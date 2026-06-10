import { Module } from '@nestjs/common';
import { RegionsController } from './regions.controller';
import { AdminRegionsController } from './admin-regions.controller';
import { RegionsService } from './regions.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [RegionsController, AdminRegionsController],
  providers: [RegionsService],
  exports: [RegionsService],
})
export class RegionsModule {}
