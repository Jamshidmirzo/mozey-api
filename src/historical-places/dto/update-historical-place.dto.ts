import {
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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MultilingualTextDto, MultilingualOptionalTextDto } from '../../museums/dto/create-museum.dto';

export class UpdateHistoricalPlaceDto {
  @ApiPropertyOptional({ description: 'Place name in 3 languages' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  @IsObject()
  name?: MultilingualTextDto;

  @ApiPropertyOptional({ description: 'Place description in 3 languages' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  @IsObject()
  description?: MultilingualTextDto;

  @ApiPropertyOptional({ description: 'Ticket price info in 3 languages' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MultilingualOptionalTextDto)
  @IsObject()
  ticketPrice?: MultilingualOptionalTextDto;

  @ApiPropertyOptional({ description: 'Latitude', example: 39.654778 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude', example: 66.959722 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'City name', example: 'Samarkand' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Region UUID (null to unset)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  regionId?: string | null;

  @ApiPropertyOptional({ description: 'Whether the place is published' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
