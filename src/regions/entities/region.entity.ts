import { ApiProperty } from '@nestjs/swagger';

/**
 * Region entity shape for Swagger documentation.
 */
export class RegionEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    example: {
      uz: 'Xorazm viloyati',
      ru: 'Хорезмская область',
      en: 'Khorezm Region',
    },
  })
  name: Record<string, string>;

  @ApiProperty({ example: 'xorazm' })
  slug: string;

  @ApiProperty({ example: 1 })
  orderIdx: number;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ nullable: true })
  deletedAt: string | null;

  @ApiProperty({ description: 'Number of museums in this region' })
  _count?: { museums: number; historicalPlaces: number };
}
