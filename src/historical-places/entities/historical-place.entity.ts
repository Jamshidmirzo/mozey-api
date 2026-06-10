import { ApiProperty } from '@nestjs/swagger';

/**
 * Historical place entity shape for Swagger documentation.
 */
export class HistoricalPlaceEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ nullable: true })
  legacyId: number | null;

  @ApiProperty({ example: { uz: 'Joy nomi', ru: 'Название места', en: 'Place name' } })
  name: Record<string, string>;

  @ApiProperty({ example: { uz: 'Tavsif', ru: 'Описание', en: 'Description' } })
  description: Record<string, string>;

  @ApiProperty({ example: { uz: 'Bepul', ru: 'Бесплатно', en: 'Free' } })
  ticketPrice: Record<string, string>;

  @ApiProperty({ example: 39.654778 })
  latitude: number;

  @ApiProperty({ example: 66.959722 })
  longitude: number;

  @ApiProperty({ example: 'Samarkand' })
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
