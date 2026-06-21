import { IsNotEmpty, IsOptional, IsString, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddPhotoDto {
  @ApiProperty({ description: 'Public URL of the uploaded photo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  url: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIdx?: number;
}
