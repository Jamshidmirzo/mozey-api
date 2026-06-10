import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard for mobile app device token authentication.
 */
@Injectable()
export class AppJwtAuthGuard extends AuthGuard('app-jwt') {}

/**
 * Guard for admin panel JWT authentication.
 */
@Injectable()
export class AdminJwtAuthGuard extends AuthGuard('admin-jwt') {}
