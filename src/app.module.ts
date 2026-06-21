import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { MuseumsModule } from './museums/museums.module';
import { HistoricalPlacesModule } from './historical-places/historical-places.module';
import { SyncModule } from './sync/sync.module';
import { AdminsModule } from './admins/admins.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { UploadModule } from './upload/upload.module';
import { RegionsModule } from './regions/regions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      serveRoot: '/static',
    }),
    PrismaModule,
    AuthModule,
    AdminAuthModule,
    MuseumsModule,
    HistoricalPlacesModule,
    SyncModule,
    AdminsModule,
    AuditLogModule,
    UploadModule,
    RegionsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
