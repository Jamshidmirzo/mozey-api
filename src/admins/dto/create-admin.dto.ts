import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'neweditor@mozey.uz',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Admin password (min 8 characters)',
    example: 'securePassword123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Admin role',
    enum: ['superadmin', 'editor'],
    example: 'editor',
  })
  @IsString()
  @IsIn(['superadmin', 'editor'])
  role: string;
}
