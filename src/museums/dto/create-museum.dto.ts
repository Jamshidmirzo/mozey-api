import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsString,
  IsObject,
  IsUUID,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MultilingualTextDto {
  @ApiProperty({ example: "Oʻzbekiston davlat sanʼat muzeyi" })
  @IsString()
  @IsNotEmpty()
  uz: string;

  @ApiProperty({ example: 'Государственный музей искусств Узбекистана' })
  @IsString()
  @IsNotEmpty()
  ru: string;

  @ApiProperty({ example: 'State Art Museum of Uzbekistan' })
  @IsString()
  @IsNotEmpty()
  en: string;
}

export class MultilingualOptionalTextDto {
  @ApiProperty({ example: '25 000 сўм' })
  @IsString()
  uz: string;

  @ApiProperty({ example: '25 000 сум' })
  @IsString()
  ru: string;

  @ApiProperty({ example: '25 000 soum' })
  @IsString()
  en: string;
}

export class CreateMuseumDto {
  @ApiPropertyOptional({
    description: 'Legacy ID from data.dart for migration',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  legacyId?: number;

  @ApiProperty({ description: 'Museum name in 3 languages' })
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  @IsObject()
  name: MultilingualTextDto;

  @ApiProperty({ description: 'Museum description in 3 languages' })
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  @IsObject()
  description: MultilingualTextDto;

  @ApiProperty({ description: 'Ticket price info in 3 languages' })
  @ValidateNested()
  @Type(() => MultilingualOptionalTextDto)
  @IsObject()
  ticketPrice: MultilingualOptionalTextDto;

  @ApiProperty({ description: 'Latitude', example: 41.311081 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude', example: 69.279737 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    description:
      'City within the region (optional — defaults to the region name on display when empty)',
    example: 'Tashkent',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Region UUID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiPropertyOptional({ description: 'Whether the museum is published', default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
