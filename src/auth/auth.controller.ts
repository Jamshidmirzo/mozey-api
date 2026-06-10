import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { DeviceAuthDto } from './dto/device-auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('device')
  @ApiOperation({
    summary: 'Register or authenticate a device',
    description:
      'Creates a new app user for the device or returns a fresh token for an existing one. Idempotent.',
  })
  @ApiResponse({ status: 201, description: 'Token issued' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async authenticateDevice(@Body() dto: DeviceAuthDto) {
    return this.authService.authenticateDevice(dto);
  }
}
