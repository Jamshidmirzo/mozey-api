import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SyncActionsDto } from './dto/sync-actions.dto';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Batch upload user actions with idempotency via client_event_id.
   * Duplicates are silently skipped (unique constraint on user_id + client_event_id).
   */
  async syncActions(userId: string, dto: SyncActionsDto) {
    let accepted = 0;
    let duplicates = 0;
    let failed = 0;

    for (const action of dto.actions) {
      try {
        await this.prisma.userAction.create({
          data: {
            userId,
            entityType: action.entityType,
            entityId: action.entityId,
            actionType: action.actionType,
            clientEventId: action.clientEventId,
            createdAt: new Date(action.createdAt),
          },
        });
        accepted++;
      } catch (error: unknown) {
        // Prisma unique constraint violation = duplicate
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          (error as { code: string }).code === 'P2002'
        ) {
          duplicates++;
        } else {
          failed++;
          this.logger.warn(
            `Failed to sync action ${action.clientEventId}: ${error}`,
          );
        }
      }
    }

    this.logger.log(
      `Sync actions for user ${userId}: ${accepted} accepted, ${duplicates} duplicates, ${failed} failed`,
    );

    return {
      accepted,
      duplicates,
      failed,
    };
  }

  /**
   * Returns a manifest of all entities with their hashes and updated_at timestamps.
   * Used by the client to determine which entities need updating.
   */
  async getManifest() {
    const [museums, historicalPlaces] = await Promise.all([
      this.prisma.museum.findMany({
        where: { deletedAt: null, isPublished: true },
        select: {
          id: true,
          updatedAt: true,
          name: true,
          description: true,
        },
      }),
      this.prisma.historicalPlace.findMany({
        where: { deletedAt: null, isPublished: true },
        select: {
          id: true,
          updatedAt: true,
          name: true,
          description: true,
        },
      }),
    ]);

    return {
      _raw: true,
      museums: museums.map((m) => ({
        id: m.id,
        updatedAt: m.updatedAt.toISOString(),
        hash: this.computeHash(m),
      })),
      historicalPlaces: historicalPlaces.map((p) => ({
        id: p.id,
        updatedAt: p.updatedAt.toISOString(),
        hash: this.computeHash(p),
      })),
      serverTime: new Date().toISOString(),
    };
  }

  /**
   * Compute a short hash for an entity to detect changes without downloading full content.
   */
  private computeHash(entity: { id: string; updatedAt: Date; name: unknown; description: unknown }): string {
    const content = JSON.stringify({
      id: entity.id,
      updatedAt: entity.updatedAt.toISOString(),
      name: entity.name,
      description: entity.description,
    });
    return createHash('md5').update(content).digest('hex').slice(0, 12);
  }
}
