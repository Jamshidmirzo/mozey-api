import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  AdminJwtPayload,
  AdminRefreshJwtPayload,
} from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: AdminLoginDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`Admin logged in: ${admin.email}`);

    return this.generateTokenPair(admin);
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: AdminRefreshJwtPayload;

    try {
      payload = this.jwtService.verify<AdminRefreshJwtPayload>(
        dto.refreshToken,
        {
          secret: this.configService.getOrThrow<string>(
            'ADMIN_JWT_REFRESH_SECRET',
          ),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'admin-refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    this.logger.log(`Admin token refreshed: ${admin.email}`);

    return this.generateTokenPair(admin);
  }

  private generateTokenPair(admin: { id: string; email: string; role: string }) {
    const accessPayload: AdminJwtPayload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      type: 'admin',
    };

    const refreshPayload: AdminRefreshJwtPayload = {
      sub: admin.id,
      type: 'admin-refresh',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.getOrThrow<string>('ADMIN_JWT_SECRET'),
      expiresIn: this.configService.get<string>('ADMIN_JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.getOrThrow<string>(
        'ADMIN_JWT_REFRESH_SECRET',
      ),
      expiresIn: this.configService.get<string>(
        'ADMIN_JWT_REFRESH_EXPIRES_IN',
        '7d',
      ),
    });

    return {
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    };
  }
}
