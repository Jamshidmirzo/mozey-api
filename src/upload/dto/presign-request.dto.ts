import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PresignRequestDto {
  @ApiProperty({
    description: 'Original filename (used as suffix for the S3 key)',
    example: 'museum-front.jpg',
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({
    description: 'MIME content type of the file',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(image\/(jpeg|png|webp|gif|svg\+xml)|application\/pdf)$/, {
    message:
      'content_type must be a valid image MIME type (image/jpeg, image/png, image/webp, image/gif, image/svg+xml) or application/pdf',
  })
  contentType: string;
}
