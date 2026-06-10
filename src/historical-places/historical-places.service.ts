import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HistoricalPlaceQueryDto } from './dto/historical-place-query.dto';
import { CreateHistoricalPlaceDto } from './dto/create-historical-place.dto';
import { UpdateHistoricalPlaceDto } from './dto/update-historical-place.dto';

@Injectable()
export class HistoricalPlacesService {
  private readonly logger = new Logger(HistoricalPlacesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public: list historical places with optional delta sync via ?since= parameter.
   */
  async findAll(query: HistoricalPlaceQueryDto) {
    const serverTime = new Date().toISOString();

    if (query.since) {
      return this.findDelta(query.since, serverTime);
    }

    const where: Prisma.HistoricalPlaceWhereInput = {
      deletedAt: null,
      isPublished: true,
    };

    if (query.city) {
      where.city = { equals: query.city, mode: 'insensitive' };
    }

    if (query.regionId) {
      where.regionId = query.regionId;
    }

    if (query.search) {
      where.OR = [
        { name: { path: ['uz'], string_contains: query.search } },
        { name: { path: ['ru'], string_contains: query.search } },
        { name: { path: ['en'], string_contains: query.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.historicalPlace.findMany({
        where,
        include: {
          photos: { orderBy: { orderIdx: 'asc' } },
          region: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.historicalPlace.count({ where }),
    ]);

    return {
      _raw: true,
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / (query.limit || 50)),
      serverTime,
    };
  }

  private async findDelta(since: string, serverTime: string) {
    const sinceDate = new Date(since);

    const [updatedItems, deletedItems] = await Promise.all([
      this.prisma.historicalPlace.findMany({
        where: {
          updatedAt: { gt: sinceDate },
          deletedAt: null,
          isPublished: true,
        },
        include: {
          photos: { orderBy: { orderIdx: 'asc' } },
          region: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { updatedAt: 'asc' },
      }),
      this.prisma.historicalPlace.findMany({
        where: {
          deletedAt: { not: null, gt: sinceDate },
        },
        select: { id: true },
      }),
    ]);

    return {
      _raw: true,
      items: updatedItems,
      deleted: deletedItems.map((d) => d.id),
      serverTime,
      nextSince: serverTime,
    };
  }

  async findOne(id: string) {
    const place = await this.prisma.historicalPlace.findFirst({
      where: { id, deletedAt: null, isPublished: true },
      include: {
        photos: { orderBy: { orderIdx: 'asc' } },
        region: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!place) {
      throw new NotFoundException('Historical place not found');
    }

    return place;
  }

  // ========================================
  // Admin methods
  // ========================================

  async adminFindAll(query: HistoricalPlaceQueryDto) {
    const where: Prisma.HistoricalPlaceWhereInput = {};

    if (query.status === 'deleted') {
      where.deletedAt = { not: null };
    } else if (query.status === 'published') {
      where.deletedAt = null;
      where.isPublished = true;
    } else if (query.status === 'draft') {
      where.deletedAt = null;
      where.isPublished = false;
    } else {
      where.deletedAt = null;
    }

    if (query.city) {
      where.city = { equals: query.city, mode: 'insensitive' };
    }

    if (query.regionId) {
      where.regionId = query.regionId;
    }

    if (query.search) {
      where.OR = [
        { name: { path: ['uz'], string_contains: query.search } },
        { name: { path: ['ru'], string_contains: query.search } },
        { name: { path: ['en'], string_contains: query.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.historicalPlace.findMany({
        where,
        include: {
          photos: { orderBy: { orderIdx: 'asc' } },
          region: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.historicalPlace.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / (query.limit || 50)),
    };
  }

  async adminFindOne(id: string) {
    const place = await this.prisma.historicalPlace.findFirst({
      where: { id, deletedAt: null },
      include: {
        photos: { orderBy: { orderIdx: 'asc' } },
        region: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!place) {
      throw new NotFoundException('Historical place not found');
    }

    return place;
  }

  async create(dto: CreateHistoricalPlaceDto) {
    if (dto.legacyId !== undefined) {
      const existing = await this.prisma.historicalPlace.findUnique({
        where: { legacyId: dto.legacyId },
      });
      if (existing) {
        throw new ConflictException(
          `Historical place with legacy_id ${dto.legacyId} already exists`,
        );
      }
    }

    const place = await this.prisma.historicalPlace.create({
      data: {
        legacyId: dto.legacyId,
        name: dto.name as unknown as Prisma.InputJsonValue,
        description: dto.description as unknown as Prisma.InputJsonValue,
        ticketPrice: dto.ticketPrice as unknown as Prisma.InputJsonValue,
        latitude: dto.latitude,
        longitude: dto.longitude,
        city: dto.city,
        regionId: dto.regionId || null,
        isPublished: dto.isPublished ?? false,
      },
      include: {
        photos: true,
        region: { select: { id: true, name: true, slug: true } },
      },
    });

    this.logger.log(`Historical place created: ${place.id}`);
    return place;
  }

  async update(id: string, dto: UpdateHistoricalPlaceDto) {
    const existing = await this.prisma.historicalPlace.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Historical place not found');
    }

    const data: Prisma.HistoricalPlaceUpdateInput = {};
    if (dto.name) data.name = dto.name as unknown as Prisma.InputJsonValue;
    if (dto.description)
      data.description = dto.description as unknown as Prisma.InputJsonValue;
    if (dto.ticketPrice)
      data.ticketPrice = dto.ticketPrice as unknown as Prisma.InputJsonValue;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.isPublished !== undefined) data.isPublished = dto.isPublished;
    if (dto.regionId !== undefined) {
      data.region = dto.regionId
        ? { connect: { id: dto.regionId } }
        : { disconnect: true };
    }

    const place = await this.prisma.historicalPlace.update({
      where: { id },
      data,
      include: {
        photos: { orderBy: { orderIdx: 'asc' } },
        region: { select: { id: true, name: true, slug: true } },
      },
    });

    this.logger.log(`Historical place updated: ${place.id}`);
    return { place, previousData: existing };
  }

  async softDelete(id: string) {
    const existing = await this.prisma.historicalPlace.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Historical place not found');
    }

    await this.prisma.historicalPlace.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Historical place soft-deleted: ${id}`);
    return { id, deleted: true };
  }

  async addPhoto(placeId: string, url: string, orderIdx: number) {
    const place = await this.prisma.historicalPlace.findFirst({
      where: { id: placeId, deletedAt: null },
    });

    if (!place) {
      throw new NotFoundException('Historical place not found');
    }

    const photo = await this.prisma.historicalPlacePhoto.create({
      data: {
        historicalPlaceId: placeId,
        url,
        orderIdx,
      },
    });

    // Touch the place so delta sync picks it up
    await this.prisma.historicalPlace.update({
      where: { id: placeId },
      data: { updatedAt: new Date() },
    });

    this.logger.log(`Photo added to historical place ${placeId}: ${photo.id}`);
    return photo;
  }

  async deletePhoto(photoId: string) {
    const photo = await this.prisma.historicalPlacePhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    await this.prisma.historicalPlacePhoto.delete({
      where: { id: photoId },
    });

    // Touch the place so delta sync picks it up
    await this.prisma.historicalPlace.update({
      where: { id: photo.historicalPlaceId },
      data: { updatedAt: new Date() },
    });

    this.logger.log(`Photo deleted: ${photoId}`);
    return { id: photoId, deleted: true };
  }
}
