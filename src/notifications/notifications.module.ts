import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FirebaseService } from './firebase.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, FirebaseService],
  exports: [FirebaseService],
})
export class NotificationsModule {}
