import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MuseumQueryDto } from './dto/museum-query.dto';
import { CreateMuseumDto } from './dto/create-museum.dto';
import { UpdateMuseumDto } from './dto/update-museum.dto';
import {
  CreateMuseumLinkDto,
  UpdateMuseumLinkDto,
} from './dto/create-museum-link.dto';

@Injectable()
export class MuseumsService {
  private readonly logger = new Logger(MuseumsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public: list museums with optional delta sync via ?since= parameter.
   * When `since` is provided, returns only items updated after that timestamp
   * plus a list of soft-deleted IDs.
   */
  async findAll(query: MuseumQueryDto) {
    const serverTime = new Date().toISOString();

    if (query.since) {
      return this.findDelta(query.since, serverTime);
    }

    const where: Prisma.MuseumWhereInput = {
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
      this.prisma.museum.findMany({
        where,
        include: {
          photos: { orderBy: { orderIdx: 'asc' } },
          links: { orderBy: { orderIdx: 'asc' } },
          region: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.museum.count({ where }),
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

  /**
   * Delta sync: returns items updated after `since` + soft-deleted IDs.
   */
  private async findDelta(since: string, serverTime: string) {
    const sinceDate = new Date(since);

    const [updatedItems, deletedItems] = await Promise.all([
      this.prisma.museum.findMany({
        where: {
          updatedAt: { gt: sinceDate },
          deletedAt: null,
          isPublished: true,
        },
        include: {
          photos: { orderBy: { orderIdx: 'asc' } },
          links: { orderBy: { orderIdx: 'asc' } },
          region: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { updatedAt: 'asc' },
      }),
      this.prisma.museum.findMany({
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

  /**
   * Public: get a single museum by ID.
   */
  async findOne(id: string) {
    const museum = await this.prisma.museum.findFirst({
      where: { id, deletedAt: null, isPublished: true },
      include: {
        photos: { orderBy: { orderIdx: 'asc' } },
        links: { orderBy: { orderIdx: 'asc' } },
        region: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!museum) {
      throw new NotFoundException('Museum not found');
    }

    return museum;
  }

  // ========================================
  // Admin methods
  // ========================================

  /**
   * Admin: list all museums (including unpublished).
   */
  async adminFindAll(query: MuseumQueryDto) {
    const where: Prisma.MuseumWhereInput = {};

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
      this.prisma.museum.findMany({
        where,
        include: {
          photos: { orderBy: { orderIdx: 'asc' } },
          links: { orderBy: { orderIdx: 'asc' } },
          region: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.museum.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / (query.limit || 50)),
    };
  }

  /**
   * Admin: get a single museum by ID (including unpublished).
   */
  async adminFindOne(id: string) {
    const museum = await this.prisma.museum.findFirst({
      where: { id, deletedAt: null },
      include: {
        photos: { orderBy: { orderIdx: 'asc' } },
        links: { orderBy: { orderIdx: 'asc' } },
        region: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!museum) {
      throw new NotFoundException('Museum not found');
    }

    return museum;
  }

  /**
   * Admin: distinct city values currently in the DB (optionally filtered
   * by region) for autosuggest in the create / edit form.
   */
  async listCities(regionId?: string): Promise<string[]> {
    const where: Prisma.MuseumWhereInput = {
      deletedAt: null,
      city: { not: '' },
    };
    if (regionId) where.regionId = regionId;

    const rows = await this.prisma.museum.findMany({
      where,
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });
    return rows.map((r) => r.city).filter((c) => c.trim().length > 0);
  }

  /**
   * Admin: create a new museum.
   */
  async create(dto: CreateMuseumDto) {
    // Check for legacy_id uniqueness
    if (dto.legacyId !== undefined) {
      const existing = await this.prisma.museum.findUnique({
        where: { legacyId: dto.legacyId },
      });
      if (existing) {
        throw new ConflictException(
          `Museum with legacy_id ${dto.legacyId} already exists`,
        );
      }
    }

    const museum = await this.prisma.museum.create({
      data: {
        legacyId: dto.legacyId,
        name: dto.name as unknown as Prisma.InputJsonValue,
        description: dto.description as unknown as Prisma.InputJsonValue,
        ticketPrice: dto.ticketPrice as unknown as Prisma.InputJsonValue,
        latitude: dto.latitude,
        longitude: dto.longitude,
        city: dto.city ?? '',
        regionId: dto.regionId || null,
        isPublished: dto.isPublished ?? false,
      },
      include: {
        photos: true,
        region: { select: { id: true, name: true, slug: true } },
      },
    });

    this.logger.log(`Museum created: ${museum.id}`);
    return museum;
  }

  /**
   * Admin: update a museum.
   */
  async update(id: string, dto: UpdateMuseumDto) {
    const existing = await this.prisma.museum.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Museum not found');
    }

    const data: Prisma.MuseumUpdateInput = {};
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

    const museum = await this.prisma.museum.update({
      where: { id },
      data,
      include: {
        photos: { orderBy: { orderIdx: 'asc' } },
        region: { select: { id: true, name: true, slug: true } },
      },
    });

    this.logger.log(`Museum updated: ${museum.id}`);
    return { museum, previousData: existing };
  }

  /**
   * Admin: soft delete a museum.
   */
  async softDelete(id: string) {
    const existing = await this.prisma.museum.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Museum not found');
    }

    await this.prisma.museum.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Museum soft-deleted: ${id}`);
    return { id, deleted: true };
  }

  /**
   * Admin: add a photo to a museum.
   */
  async addPhoto(museumId: string, url: string, orderIdx: number) {
    const museum = await this.prisma.museum.findFirst({
      where: { id: museumId, deletedAt: null },
    });

    if (!museum) {
      throw new NotFoundException('Museum not found');
    }

    const photo = await this.prisma.museumPhoto.create({
      data: {
        museumId,
        url,
        orderIdx,
      },
    });

    // Touch the museum so delta sync picks it up
    await this.prisma.museum.update({
      where: { id: museumId },
      data: { updatedAt: new Date() },
    });

    this.logger.log(`Photo added to museum ${museumId}: ${photo.id}`);
    return photo;
  }

  /**
   * Admin: delete a photo.
   */
  async deletePhoto(photoId: string) {
    const photo = await this.prisma.museumPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    await this.prisma.museumPhoto.delete({
      where: { id: photoId },
    });

    // Touch the museum so delta sync picks it up
    await this.prisma.museum.update({
      where: { id: photo.museumId },
      data: { updatedAt: new Date() },
    });

    this.logger.log(`Photo deleted: ${photoId}`);
    return { id: photoId, deleted: true };
  }

  // ========================================
  // Museum links
  // ========================================

  async addLink(museumId: string, dto: CreateMuseumLinkDto) {
    const museum = await this.prisma.museum.findFirst({
      where: { id: museumId, deletedAt: null },
    });

    if (!museum) {
      throw new NotFoundException('Museum not found');
    }

    const link = await this.prisma.museumLink.create({
      data: {
        museumId,
        url: dto.url,
        kind: dto.kind ?? 'website',
        label: (dto.label ?? null) as unknown as Prisma.InputJsonValue,
        orderIdx: dto.orderIdx ?? 0,
      },
    });

    await this.prisma.museum.update({
      where: { id: museumId },
      data: { updatedAt: new Date() },
    });

    this.logger.log(`Link added to museum ${museumId}: ${link.id}`);
    return link;
  }

  async updateLink(linkId: string, dto: UpdateMuseumLinkDto) {
    const existing = await this.prisma.museumLink.findUnique({
      where: { id: linkId },
    });

    if (!existing) {
      throw new NotFoundException('Link not found');
    }

    const data: Prisma.MuseumLinkUpdateInput = {};
    if (dto.url !== undefined) data.url = dto.url;
    if (dto.kind !== undefined) data.kind = dto.kind;
    if (dto.label !== undefined)
      data.label = dto.label as unknown as Prisma.InputJsonValue;
    if (dto.orderIdx !== undefined) data.orderIdx = dto.orderIdx;

    const link = await this.prisma.museumLink.update({
      where: { id: linkId },
      data,
    });

    await this.prisma.museum.update({
      where: { id: existing.museumId },
      data: { updatedAt: new Date() },
    });

    this.logger.log(`Link updated: ${linkId}`);
    return link;
  }

  async deleteLink(linkId: string) {
    const link = await this.prisma.museumLink.findUnique({
      where: { id: linkId },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    await this.prisma.museumLink.delete({ where: { id: linkId } });

    await this.prisma.museum.update({
      where: { id: link.museumId },
      data: { updatedAt: new Date() },
    });

    this.logger.log(`Link deleted: ${linkId}`);
    return { id: linkId, deleted: true };
  }
}
