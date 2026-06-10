import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

export interface AuditLogEntry {
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  diff: Record<string, unknown> | null;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List audit log entries with pagination and optional filtering.
   */
  async findAll(params: AuditLogQueryDto) {
    const where: Prisma.AuditLogWhereInput = {};

    if (params.adminId) {
      where.adminId = params.adminId;
    }
    if (params.entityType) {
      where.entityType = params.entityType;
    }
    if (params.action) {
      where.action = params.action;
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        adminId: item.adminId,
        adminEmail: item.admin.email,
        adminRole: item.admin.role,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        diff: item.diff,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / (params.limit || 50)),
    };
  }

  /**
   * Create an audit log entry. Called by admin controllers after every mutation.
   * Never throws — audit logging must not break the main operation.
   */
  async log(entry: AuditLogEntry) {
    try {
      await this.prisma.auditLog.create({
        data: {
          adminId: entry.adminId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          diff: entry.diff as unknown as Prisma.InputJsonValue ?? undefined,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create audit log entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
