import * as path from 'path';
import * as dotenv from 'dotenv';

// Подгружаем .env ДО импортов модулей.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';

/**
 * Стратегия запуска тестов:
 *  - если переменная `LIVE_API_URL` задана (например, http://localhost:3333),
 *    тесты будут стучаться напрямую туда через supertest. Это нужно потому
 *    что vitest+esbuild не сохраняет `emitDecoratorMetadata` и Nest DI
 *    не может построить контейнер in-process без дополнительного SWC-плагина.
 *  - если не задана — пытаемся поднять Nest in-process (для CI с SWC).
 *
 * При локальном `npm run dev` API уже слушает на :3333 — поэтому по умолчанию
 * мы предпочитаем live режим.
 */
export const LIVE_API_URL =
  process.env.LIVE_API_URL || `http://localhost:${process.env.PORT || 3333}`;

interface TestTarget {
  /** То, что отдаём в `request()` — либо supertest agent на URL, либо http.Server */
  server: string | unknown;
  /** close — может быть no-op для live */
  close: () => Promise<void>;
  /** режим */
  mode: 'live' | 'in-process';
}

async function pingLive(): Promise<boolean> {
  try {
    const res = await fetch(`${LIVE_API_URL}/api/v1/health`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Главная фабрика. Возвращает target, который понимает supertest.
 */
export async function createTestApp(): Promise<TestTarget> {
  // 1) Пробуем live
  if (await pingLive()) {
    console.info(`[e2e] using LIVE API at ${LIVE_API_URL}`);
    return {
      server: LIVE_API_URL,
      close: async () => {},
      mode: 'live',
    };
  }

  // 2) Падаем в in-process (потребует SWC, иначе крашнется на DI)
  console.warn(
    `[e2e] LIVE_API_URL (${LIVE_API_URL}) недоступен. ` +
      `Пробуем поднять Nest in-process; если упадёт на DI — запустите ` +
      `\`npm run dev\` в отдельном терминале и/или задайте LIVE_API_URL.`,
  );
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app: INestApplication = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  await app.init();
  return {
    server: app.getHttpServer(),
    close: () => app.close(),
    mode: 'in-process',
  };
}

export function getSeedAdminCredentials(): { email: string; password: string } {
  return {
    email: process.env.ADMIN_SEED_EMAIL || 'tylerthecaretaker@gmail.com',
    password: process.env.ADMIN_SEED_PASSWORD || 'replace-me',
  };
}

/**
 * Возвращает список «известных» пар creds которые seed.ts создаёт.
 * Используется fallback'ом в admin-crud тестах если основной seed-пароль не подходит.
 */
export function getKnownSeedAccounts(): Array<{
  email: string;
  password: string;
  role: 'superadmin' | 'editor';
}> {
  return [
    {
      email: process.env.ADMIN_SEED_EMAIL || 'tylerthecaretaker@gmail.com',
      password: process.env.ADMIN_SEED_PASSWORD || 'replace-me',
      role: 'superadmin',
    },
    // Дефолты из prisma/seed.ts (строки 7–8 и 24–25)
    { email: 'admin@mozey.uz', password: 'admin123456', role: 'superadmin' },
    { email: 'editor@mozey.uz', password: 'editor123456', role: 'editor' },
  ];
}

export function uniqueSlug(prefix = 'qa'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}
