import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from './firebase.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

interface LocalizedField {
  uz: string;
  ru: string;
  en: string;
  [key: string]: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async sendNotification(dto: CreateNotificationDto, adminId: string) {
    const title = dto.title as LocalizedField;
    const body = dto.body as LocalizedField;

    let sentCount = 0;
    let failedCount = 0;

    if (dto.topic) {
      const success = await this.firebaseService.sendToTopic(
        dto.topic,
        title.uz || title.ru || title.en,
        body.uz || body.ru || body.en,
      );
      sentCount = success ? 1 : 0;
      failedCount = success ? 0 : 1;
    } else {
      const users = await this.prisma.appUser.findMany({
        where: { fcmToken: { not: null } },
        select: { id: true, fcmToken: true, locale: true },
      });

      if (users.length === 0) {
        this.logger.warn('No users with FCM tokens found');
      }

      const localeGroups: Record<string, string[]> = { uz: [], ru: [], en: [] };

      for (const user of users) {
        const locale =
          user.locale && ['uz', 'ru', 'en'].includes(user.locale)
            ? user.locale
            : 'uz';
        localeGroups[locale].push(user.fcmToken!);
      }

      const allInvalidTokens: string[] = [];

      for (const locale of Object.keys(localeGroups)) {
        const tokens = localeGroups[locale];
        if (tokens.length === 0) continue;

        const localizedTitle =
          (title as Record<string, string>)[locale] ||
          title.uz ||
          title.ru ||
          title.en;
        const localizedBody =
          (body as Record<string, string>)[locale] ||
          body.uz ||
          body.ru ||
          body.en;

        const result = await this.firebaseService.sendToDevices(
          tokens,
          localizedTitle,
          localizedBody,
        );

        sentCount += result.successCount;
        failedCount += result.failureCount;
        allInvalidTokens.push(...result.invalidTokens);
      }

      if (allInvalidTokens.length > 0) {
        this.logger.log(
          `Cleaning up ${allInvalidTokens.length} invalid FCM tokens`,
        );
        await this.prisma.appUser.updateMany({
          where: { fcmToken: { in: allInvalidTokens } },
          data: { fcmToken: null },
        });
      }
    }

    const notification = await this.prisma.notification.create({
      data: {
        title: dto.title as any,
        body: dto.body as any,
        topic: dto.topic ?? null,
        sentCount,
        failedCount,
        adminId,
      },
      include: {
        admin: { select: { id: true, email: true, role: true } },
      },
    });

    return {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      topic: notification.topic,
      sentCount: notification.sentCount,
      failedCount: notification.failedCount,
      adminId: notification.adminId,
      adminEmail: notification.admin.email,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  async findAll(params: { page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          admin: { select: { id: true, email: true, role: true } },
        },
      }),
      this.prisma.notification.count(),
    ]);

    return {
      items: items.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        topic: n.topic,
        sentCount: n.sentCount,
        failedCount: n.failedCount,
        adminId: n.adminId,
        adminEmail: n.admin.email,
        createdAt: n.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
