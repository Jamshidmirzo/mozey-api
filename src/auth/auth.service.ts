import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceAuthDto } from './dto/device-auth.dto';
import { AppJwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register or authenticate a device. Returns a JWT for the app.
   * Idempotent: if the device already exists, we update metadata and return a new token.
   */
  async authenticateDevice(dto: DeviceAuthDto) {
    let user = await this.prisma.appUser.findUnique({
      where: { deviceId: dto.deviceId },
    });

    if (user) {
      // Update metadata on each auth
      user = await this.prisma.appUser.update({
        where: { id: user.id },
        data: {
          locale: dto.locale ?? user.locale,
          appVersion: dto.appVersion ?? user.appVersion,
          lastSeenAt: new Date(),
        },
      });
      this.logger.log(`Device re-authenticated: ${dto.deviceId}`);
    } else {
      user = await this.prisma.appUser.create({
        data: {
          deviceId: dto.deviceId,
          locale: dto.locale,
          appVersion: dto.appVersion,
        },
      });
      this.logger.log(`New device registered: ${dto.deviceId}`);
    }

    const payload: AppJwtPayload = {
      sub: user.id,
      deviceId: user.deviceId,
      type: 'app',
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('APP_JWT_SECRET'),
      expiresIn: this.configService.get<string>('APP_JWT_EXPIRES_IN', '365d'),
    });

    return {
      token,
      userId: user.id,
    };
  }
}
