import { AdminRole } from '../enums';

/** JWT payload for mobile app device tokens. */
export interface AppJwtPayload {
  /** App user UUID */
  sub: string;
  deviceId: string;
  type: 'app';
}

/** JWT payload for admin access tokens. */
export interface AdminJwtPayload {
  /** Admin UUID */
  sub: string;
  email: string;
  role: AdminRole;
  type: 'admin';
}

/** JWT payload for admin refresh tokens. */
export interface AdminRefreshJwtPayload {
  /** Admin UUID */
  sub: string;
  type: 'admin-refresh';
}
