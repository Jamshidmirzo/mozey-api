/**
 * Глобальный setup-файл vitest для e2e-тестов.
 * 1) Подгружает reflect-metadata (Nest CLI делает это автоматически в проде,
 *    но vitest стартует ts-файл «голым» и без неё @Injectable метаданные пропадают).
 * 2) Подгружает .env в process.env до старта тестов, чтобы NestJS ConfigModule
 *    увидел все переменные.
 */
import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
