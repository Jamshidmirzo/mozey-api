/**
 * Minimal type shim for `multer`. We only use `diskStorage` from the package
 * directly (FileInterceptor lives in @nestjs/platform-express and is already
 * typed). Pulling in the full `@types/multer` package would add a dev dep
 * we do not otherwise need, so we declare just enough to keep
 * `noImplicitAny` happy.
 */
declare module 'multer' {
  /** Subset of multer's File shape used by our callbacks. */
  export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }

  export type DiskStorageDestinationCallback = (
    error: Error | null,
    destination: string,
  ) => void;

  export type DiskStorageFilenameCallback = (
    error: Error | null,
    filename: string,
  ) => void;

  export interface DiskStorageOptions {
    destination?:
      | string
      | ((
          req: unknown,
          file: MulterFile,
          cb: DiskStorageDestinationCallback,
        ) => void);
    filename?: (
      req: unknown,
      file: MulterFile,
      cb: DiskStorageFilenameCallback,
    ) => void;
  }

  // Opaque storage engine token — we only pass it through to FileInterceptor.
  export interface StorageEngine {
    readonly _multerStorageEngine: true;
  }

  export function diskStorage(opts: DiskStorageOptions): StorageEngine;
  export function memoryStorage(): StorageEngine;
}
