import {
  Injectable,
  UnauthorizedException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SsoExchangeDto } from './dto/sso-exchange.dto';
import {
  AdminJwtPayload,
  AdminRefreshJwtPayload,
} from '../common/interfaces/jwt-payload.interface';
import { AdminRole } from '../common/enums';

interface FlekSsoClaims {
  iss?: string;
  aud?: string | string[];
  sub?: string;
  name?: string;
  role?: string;
  exp?: number;
  iat?: number;
  nonce?: string;
}

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

  /**
   * Single-sign-on entry: verify a JWT minted by flek-monitor and return a
   * regular admin token pair if the email maps to a known Admin.
   *
   * Required env: FLEK_SSO_SECRET (HMAC HS256, shared with flek-monitor).
   * Optional env:
   *   - FLEK_SSO_ALLOWED_ISS (default "flek-monitor")
   *   - FLEK_SSO_ALLOWED_AUD (default "mozey")
   *   - FLEK_SSO_AUTOPROVISION ("true" → create a new Admin if missing,
   *                              default false for safety)
   *   - FLEK_SSO_DEFAULT_ROLE  (default "editor", used only with autoprovision)
   */
  async exchangeSso(dto: SsoExchangeDto) {
    const secret = this.configService.get<string>('FLEK_SSO_SECRET');
    if (!secret) {
      throw new ForbiddenException('SSO is not configured on this server');
    }

    let claims: FlekSsoClaims;
    try {
      claims = this.jwtService.verify<FlekSsoClaims>(dto.token, {
        secret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired SSO token');
    }

    const expectedIss = this.configService.get<string>(
      'FLEK_SSO_ALLOWED_ISS',
      'flek-monitor',
    );
    if (claims.iss !== expectedIss) {
      throw new UnauthorizedException(`Unexpected issuer: ${claims.iss}`);
    }

    const expectedAud = this.configService.get<string>(
      'FLEK_SSO_ALLOWED_AUD',
      'mozey',
    );
    const audOk = Array.isArray(claims.aud)
      ? claims.aud.includes(expectedAud)
      : claims.aud === expectedAud;
    if (!audOk) {
      throw new UnauthorizedException(`Token not addressed to '${expectedAud}'`);
    }

    const email = claims.sub?.toLowerCase();
    if (!email) {
      throw new UnauthorizedException('SSO token has no sub (email)');
    }

    let admin = await this.prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      const autoprov =
        this.configService.get<string>('FLEK_SSO_AUTOPROVISION') === 'true';
      if (!autoprov) {
        throw new UnauthorizedException(
          `No Mozey admin account exists for ${email}. Ask the team to add one or set FLEK_SSO_AUTOPROVISION=true.`,
        );
      }
      const role = this.configService.get<string>(
        'FLEK_SSO_DEFAULT_ROLE',
        'editor',
      );
      // bcrypt of a random unguessable value — password login stays disabled
      // for SSO-provisioned admins.
      const placeholderHash = await bcrypt.hash(
        `flek-sso-${email}-${Date.now()}-${Math.random()}`,
        10,
      );
      admin = await this.prisma.admin.create({
        data: {
          email,
          role,
          passwordHash: placeholderHash,
        },
      });
      this.logger.log(`Admin autoprovisioned via Flek SSO: ${email} (${role})`);
    } else {
      this.logger.log(`Admin logged in via Flek SSO: ${admin.email}`);
    }

    return this.generateTokenPair(admin);
  }

  private generateTokenPair(admin: { id: string; email: string; role: string }) {
    const accessPayload: AdminJwtPayload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role as AdminRole,
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
