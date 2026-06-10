import { Module } from '@nestjs/common';
import { HistoricalPlacesController } from './historical-places.controller';
import {
  AdminHistoricalPlacesController,
  AdminHistoricalPlacePhotosController,
} from './admin-historical-places.controller';
import { HistoricalPlacesService } from './historical-places.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [
    HistoricalPlacesController,
    AdminHistoricalPlacesController,
    AdminHistoricalPlacePhotosController,
  ],
  providers: [HistoricalPlacesService],
  exports: [HistoricalPlacesService],
})
export class HistoricalPlacesModule {}
