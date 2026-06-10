/**
 * JWT payload for mobile app device tokens.
 */
export interface AppJwtPayload {
  sub: string; // user UUID
  deviceId: string;
  type: 'app';
}

/**
 * JWT payload for admin access tokens.
 */
export interface AdminJwtPayload {
  sub: string; // admin UUID
  email: string;
  role: string;
  type: 'admin';
}

/**
 * JWT payload for admin refresh tokens.
 */
export interface AdminRefreshJwtPayload {
  sub: string; // admin UUID
  type: 'admin-refresh';
}
