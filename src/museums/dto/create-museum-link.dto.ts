import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsObject,
  IsUrl,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MuseumLinkLabelDto {
  @ApiProperty({ example: 'Rasmiy sayt' })
  @IsString()
  uz: string;

  @ApiProperty({ example: 'Официальный сайт' })
  @IsString()
  ru: string;

  @ApiProperty({ example: 'Official site' })
  @IsString()
  en: string;
}

export class CreateMuseumLinkDto {
  @ApiProperty({ example: 'https://museum.uz' })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  url: string;

  @ApiPropertyOptional({
    description:
      'Link kind: website | instagram | telegram | youtube | facebook | ticket | other',
    example: 'website',
    default: 'website',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  kind?: string;

  @ApiPropertyOptional({
    description: 'Optional multilingual label for the link.',
    type: MuseumLinkLabelDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MuseumLinkLabelDto)
  @IsObject()
  label?: MuseumLinkLabelDto;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIdx?: number;
}

export class UpdateMuseumLinkDto {
  @ApiPropertyOptional({ example: 'https://museum.uz' })
  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  url?: string;

  @ApiPropertyOptional({ example: 'instagram' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  kind?: string;

  @ApiPropertyOptional({ type: MuseumLinkLabelDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MuseumLinkLabelDto)
  @IsObject()
  label?: MuseumLinkLabelDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIdx?: number;
}
