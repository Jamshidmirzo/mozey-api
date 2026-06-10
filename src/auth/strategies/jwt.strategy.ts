import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppJwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AppJwtStrategy extends PassportStrategy(Strategy, 'app-jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('APP_JWT_SECRET'),
    });
  }

  async validate(payload: AppJwtPayload) {
    if (payload.type !== 'app') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.appUser.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Update last_seen_at
    await this.prisma.appUser.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });

    return { id: user.id, deviceId: user.deviceId };
  }
}
