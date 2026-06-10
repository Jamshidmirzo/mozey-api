import {
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsString,
  IsIn,
  IsDateString,
  IsUUID,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SyncActionItemDto {
  @ApiProperty({
    description: 'Entity type',
    enum: ['museum', 'historical'],
    example: 'museum',
  })
  @IsString()
  @IsIn(['museum', 'historical'])
  entityType: string;

  @ApiProperty({
    description: 'Entity UUID',
    format: 'uuid',
  })
  @IsUUID()
  entityId: string;

  @ApiProperty({
    description: 'Action type',
    enum: ['like', 'unlike', 'save', 'unsave'],
    example: 'like',
  })
  @IsString()
  @IsIn(['like', 'unlike', 'save', 'unsave'])
  actionType: string;

  @ApiProperty({
    description: 'Client-generated unique event ID for idempotency',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsString()
  @IsNotEmpty()
  clientEventId: string;

  @ApiProperty({
    description: 'When the action occurred on the client (ISO 8601)',
    example: '2024-03-15T10:30:00.000Z',
  })
  @IsDateString()
  createdAt: string;
}

export class SyncActionsDto {
  @ApiProperty({
    description: 'Array of user action events to sync (max 100 per batch)',
    type: [SyncActionItemDto],
  })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SyncActionItemDto)
  actions: SyncActionItemDto[];
}
