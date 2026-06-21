import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AdminRole } from '../../common/enums';

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
    enum: AdminRole,
    example: AdminRole.EDITOR,
  })
  @IsString()
  @IsIn(Object.values(AdminRole))
  role: string;
}
