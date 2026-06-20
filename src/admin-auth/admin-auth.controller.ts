import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SsoExchangeDto } from './dto/sso-exchange.dto';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Admin login',
    description: 'Authenticate with email and password. Returns access + refresh tokens.',
  })
  @ApiResponse({ status: 201, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh admin tokens',
    description: 'Exchange a valid refresh token for new access + refresh tokens.',
  })
  @ApiResponse({ status: 201, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.adminAuthService.refresh(dto);
  }

  @Post('sso-exchange')
  @ApiOperation({
    summary: 'Exchange a Flek SSO token for Mozey admin tokens',
    description:
      'Accepts a short-lived JWT issued by flek-monitor (HS256, FLEK_SSO_SECRET). ' +
      'On success returns the same shape as /login. If the email is not in the ' +
      'admin DB the request is rejected unless FLEK_SSO_AUTOPROVISION=true.',
  })
  @ApiResponse({ status: 201, description: 'SSO accepted, tokens issued' })
  @ApiResponse({ status: 401, description: 'Invalid SSO token or unknown email' })
  @ApiResponse({ status: 403, description: 'SSO is not configured on this server' })
  async ssoExchange(@Body() dto: SsoExchangeDto) {
    return this.adminAuthService.exchangeSso(dto);
  }
}
