import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeviceAuthDto {
  @ApiProperty({
    description: 'Unique device identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  deviceId: string;

  @ApiPropertyOptional({
    description: 'Device locale',
    example: 'uz',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  locale?: string;

  @ApiPropertyOptional({
    description: 'App version string',
    example: '2.0.0',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  appVersion?: string;

  @ApiPropertyOptional({
    description: 'Firebase Cloud Messaging token',
    example: 'fMfN...long-token',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fcmToken?: string;
}
