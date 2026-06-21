import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Notification title in 3 languages',
    example: { uz: 'Yangilik', ru: 'Новость', en: 'News' },
  })
  @IsNotEmpty()
  @IsObject()
  title: { uz: string; ru: string; en: string };

  @ApiProperty({
    description: 'Notification body in 3 languages',
    example: {
      uz: "Yangi muzey qo'shildi",
      ru: 'Добавлен новый музей',
      en: 'New museum added',
    },
  })
  @IsNotEmpty()
  @IsObject()
  body: { uz: string; ru: string; en: string };

  @ApiPropertyOptional({
    description:
      'Firebase topic to send to (if not provided, sends to all devices)',
    example: 'news',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  topic?: string;
}
