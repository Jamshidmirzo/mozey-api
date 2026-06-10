import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict access by admin role.
 * Usage: @Roles('superadmin') or @Roles('superadmin', 'editor')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
