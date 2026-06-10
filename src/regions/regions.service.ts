import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { RegionQueryDto } from './dto/region-query.dto';

@Injectable()
export class RegionsService {
  private readonly logger = new Logger(RegionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public: list all active regions ordered by orderIdx.
   */
  async findAll(query: RegionQueryDto) {
    const where: Prisma.RegionWhereInput = {
      deletedAt: null,
    };

    if (query.search) {
      where.OR = [
        { name: { path: ['uz'], string_contains: query.search } },
        { name: { path: ['ru'], string_contains: query.search } },
        { name: { path: ['en'], string_contains: query.search } },
      ];
    }

    const items = await this.prisma.region.findMany({
      where,
      orderBy: { orderIdx: 'asc' },
      include: {
        _count: {
          select: {
            museums: { where: { deletedAt: null, isPublished: true } },
            historicalPlaces: { where: { deletedAt: null, isPublished: true } },
          },
        },
      },
    });

    return {
      _raw: true,
      items,
      total: items.length,
    };
  }

  /**
   * Public: get a single region by ID.
   */
  async findOne(id: string) {
    const region = await this.prisma.region.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            museums: { where: { deletedAt: null, isPublished: true } },
            historicalPlaces: { where: { deletedAt: null, isPublished: true } },
          },
        },
      },
    });

    if (!region) {
      throw new NotFoundException('Region not found');
    }

    return region;
  }

  // ========================================
  // Admin methods
  // ========================================

  /**
   * Admin: list all regions (including soft-deleted).
   */
  async adminFindAll(query: RegionQueryDto) {
    const where: Prisma.RegionWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { path: ['uz'], string_contains: query.search } },
        { name: { path: ['ru'], string_contains: query.search } },
        { name: { path: ['en'], string_contains: query.search } },
      ];
    }

    const items = await this.prisma.region.findMany({
      where,
      orderBy: { orderIdx: 'asc' },
      include: {
        _count: {
          select: {
            museums: { where: { deletedAt: null } },
            historicalPlaces: { where: { deletedAt: null } },
          },
        },
      },
    });

    return {
      items,
      total: items.length,
    };
  }

  /**
   * Admin: get a single region by ID (including soft-deleted).
   */
  async adminFindOne(id: string) {
    const region = await this.prisma.region.findFirst({
      where: { id },
      include: {
        _count: {
          select: {
            museums: { where: { deletedAt: null } },
            historicalPlaces: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!region) {
      throw new NotFoundException('Region not found');
    }

    return region;
  }

  /**
   * Admin: create a new region.
   */
  async create(dto: CreateRegionDto) {
    // Check slug uniqueness
    const existing = await this.prisma.region.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Region with slug "${dto.slug}" already exists`);
    }

    const region = await this.prisma.region.create({
      data: {
        name: dto.name as unknown as Prisma.InputJsonValue,
        slug: dto.slug,
        orderIdx: dto.orderIdx ?? 0,
      },
      include: {
        _count: {
          select: {
            museums: { where: { deletedAt: null } },
            historicalPlaces: { where: { deletedAt: null } },
          },
        },
      },
    });

    this.logger.log(`Region created: ${region.id} (${dto.slug})`);
    return region;
  }

  /**
   * Admin: update a region.
   */
  async update(id: string, dto: UpdateRegionDto) {
    const existing = await this.prisma.region.findFirst({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Region not found');
    }

    // Check slug uniqueness if changing
    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.prisma.region.findUnique({
        where: { slug: dto.slug },
      });
      if (slugExists) {
        throw new ConflictException(
          `Region with slug "${dto.slug}" already exists`,
        );
      }
    }

    const data: Prisma.RegionUpdateInput = {};
    if (dto.name) data.name = dto.name as unknown as Prisma.InputJsonValue;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.orderIdx !== undefined) data.orderIdx = dto.orderIdx;

    const region = await this.prisma.region.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            museums: { where: { deletedAt: null } },
            historicalPlaces: { where: { deletedAt: null } },
          },
        },
      },
    });

    this.logger.log(`Region updated: ${region.id}`);
    return { region, previousData: existing };
  }

  /**
   * Admin: soft delete a region.
   * Museums/places in this region keep their region_id but region won't appear in lists.
   */
  async softDelete(id: string) {
    const existing = await this.prisma.region.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Region not found');
    }

    await this.prisma.region.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Region soft-deleted: ${id}`);
    return { id, deleted: true };
  }

  /**
   * Admin: get a compact list of regions for dropdowns (id + name only).
   */
  async getDropdownList() {
    const regions = await this.prisma.region.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { orderIdx: 'asc' },
    });

    return regions;
  }
}
