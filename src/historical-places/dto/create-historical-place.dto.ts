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
import { MultilingualTextDto, MultilingualOptionalTextDto } from '../../museums/dto/create-museum.dto';

export class CreateHistoricalPlaceDto {
  @ApiPropertyOptional({
    description: 'Legacy ID from data_historical.dart for migration',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  legacyId?: number;

  @ApiProperty({ description: 'Place name in 3 languages' })
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  @IsObject()
  name: MultilingualTextDto;

  @ApiProperty({ description: 'Place description in 3 languages' })
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  @IsObject()
  description: MultilingualTextDto;

  @ApiProperty({ description: 'Ticket price info in 3 languages' })
  @ValidateNested()
  @Type(() => MultilingualOptionalTextDto)
  @IsObject()
  ticketPrice: MultilingualOptionalTextDto;

  @ApiProperty({ description: 'Latitude', example: 39.654778 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude', example: 66.959722 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    description:
      'City within the region (optional — defaults to the region name on display when empty)',
    example: 'Samarkand',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Region UUID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiPropertyOptional({ description: 'Whether the place is published', default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
