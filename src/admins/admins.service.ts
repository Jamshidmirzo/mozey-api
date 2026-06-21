import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { BCRYPT_SALT_ROUNDS } from '../common/constants';

@Injectable()
export class AdminsService {
  private readonly logger = new Logger(AdminsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const admins = await this.prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return admins;
  }

  async create(dto: CreateAdminDto) {
    const existing = await this.prisma.admin.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const admin = await this.prisma.admin.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: dto.role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    this.logger.log(`Admin created: ${admin.email} (${admin.role})`);
    return admin;
  }

  async remove(id: string, currentAdminId: string) {
    if (id === currentAdminId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Prevent deleting the last superadmin
    if (admin.role === 'superadmin') {
      const superadminCount = await this.prisma.admin.count({
        where: { role: 'superadmin' },
      });

      if (superadminCount <= 1) {
        throw new ForbiddenException(
          'Cannot delete the last superadmin account',
        );
      }
    }

    await this.prisma.admin.delete({
      where: { id },
    });

    this.logger.log(`Admin deleted: ${admin.email}`);
    return { id, deleted: true };
  }
}
