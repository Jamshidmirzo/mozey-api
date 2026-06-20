import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SsoExchangeDto {
  @ApiProperty({
    description:
      'JWT issued by the flek-monitor IdP. Signed with FLEK_SSO_SECRET (HS256). ' +
      'Must have claims iss="flek-monitor", aud="mozey", sub=email.',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
