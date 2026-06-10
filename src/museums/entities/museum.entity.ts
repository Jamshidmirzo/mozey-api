import { ApiProperty } from '@nestjs/swagger';

/**
 * Museum entity shape for Swagger documentation.
 * The actual data comes from Prisma — this is for OpenAPI docs only.
 */
export class MuseumEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ nullable: true })
  legacyId: number | null;

  @ApiProperty({ example: { uz: 'Muzey nomi', ru: 'Название музея', en: 'Museum name' } })
  name: Record<string, string>;

  @ApiProperty({ example: { uz: 'Tavsif', ru: 'Описание', en: 'Description' } })
  description: Record<string, string>;

  @ApiProperty({ example: { uz: 'Bepul', ru: 'Бесплатно', en: 'Free' } })
  ticketPrice: Record<string, string>;

  @ApiProperty({ example: 41.311081 })
  latitude: number;

  @ApiProperty({ example: 69.279737 })
  longitude: number;

  @ApiProperty({ example: 'Tashkent' })
  city: string;

  @ApiProperty()
  isPublished: boolean;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  photos: object[];

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ nullable: true })
  deletedAt: string | null;
}
