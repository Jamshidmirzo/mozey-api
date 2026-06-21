import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { basename } from 'path';
import { PRESIGN_EXPIRY_SECONDS } from '../common/constants';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.getOrThrow<string>('S3_ENDPOINT');
    const region = this.configService.get<string>('S3_REGION', 'auto');
    const accessKeyId = this.configService.getOrThrow<string>('S3_ACCESS_KEY');
    const secretAccessKey =
      this.configService.getOrThrow<string>('S3_SECRET_KEY');

    this.bucket = this.configService.getOrThrow<string>('S3_BUCKET');
    this.publicUrl = this.configService.get<string>(
      'S3_PUBLIC_URL',
      `${endpoint}/${this.bucket}`,
    );

    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for MinIO and most S3-compatible services
    });
  }

  /**
   * Generate a presigned PUT URL for direct client upload to S3.
   * The URL expires in 15 minutes per the spec.
   * Returns the upload URL (presigned) and the final public file URL.
   */
  async generatePresignedUrl(
    filename: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    // Sanitize filename: keep only safe characters for the S3 key suffix
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `uploads/${uuidv4()}-${sanitizedFilename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: PRESIGN_EXPIRY_SECONDS,
    });

    const fileUrl = `${this.publicUrl}/${key}`;

    this.logger.log(`Presigned URL generated for key: ${key}`);

    return {
      uploadUrl,
      fileUrl,
      key,
    };
  }

  /**
   * Build the public file URL + key descriptor for a file that has already
   * been written to `public/uploads/<filename>` by Multer's disk storage.
   *
   * The returned shape mirrors `generatePresignedUrl` so the admin frontend
   * can treat both paths the same way once the file is on disk / in S3.
   */
  buildLocalUploadResult(filename: string): { fileUrl: string; key: string } {
    // Defensively strip any leading directory components — Multer's disk
    // storage already gives us a flat filename, but we want to be sure
    // nothing like "../../etc/passwd" leaks into the URL.
    const safeName = basename(filename);
    const key = `uploads/${safeName}`;
    const publicBase = this.configService
      .get<string>('PUBLIC_BASE_URL', 'http://localhost:3333')
      .replace(/\/+$/, '');
    const fileUrl = `${publicBase}/static/uploads/${safeName}`;
    this.logger.log(`Local upload stored: ${key}`);
    return { fileUrl, key };
  }

  /**
   * Delete a file from S3 by its key.
   */
  async deleteFile(key: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
      this.logger.log(`File deleted from S3: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${key}`, error);
      throw error;
    }
  }

  /**
   * Extract the S3 key from a full URL.
   */
  extractKeyFromUrl(url: string): string | null {
    if (!url.startsWith(this.publicUrl)) {
      return null;
    }
    return url.replace(`${this.publicUrl}/`, '');
  }
}
