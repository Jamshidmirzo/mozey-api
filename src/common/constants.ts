// ── Sync ─────────────────────────────────────────────────────────────
/** Maximum number of user action events per POST /sync/actions batch. */
export const SYNC_BATCH_MAX_SIZE = 100;

/** Truncated MD5 hex length used in GET /sync/manifest hashes. */
export const MANIFEST_HASH_LENGTH = 12;

// ── Upload / S3 ──────────────────────────────────────────────────────
/** Presigned PUT URL lifetime in seconds (15 minutes). */
export const PRESIGN_EXPIRY_SECONDS = 900;

/** Hard limit for multipart file uploads (10 MB). */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** MIME types accepted by the direct-upload and presign endpoints. */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

// ── Pagination ───────────────────────────────────────────────────────
/** Default page size when `?limit` is omitted. */
export const DEFAULT_PAGE_SIZE = 50;

/** Upper bound for `?limit` to prevent accidental full-table dumps. */
export const MAX_PAGE_SIZE = 200;

// ── Auth / Security ──────────────────────────────────────────────────
/** Bcrypt cost factor for admin password hashing. */
export const BCRYPT_SALT_ROUNDS = 12;

/** CORS preflight cache duration in seconds (24 hours). */
export const CORS_MAX_AGE_SECONDS = 86_400;
