/**
 * §A1. Регионы — публичный контракт.
 *
 * Цель: зафиксировать, что веб (`web/apps/landing/lib/api.ts`) и мобильный
 * (`mobile/lib/core/config/remote_config.dart`) могут безопасно парсить
 * ответ `/api/v1/regions`. Если форма ответа поменяется — этот файл упадёт
 * первым.
 */
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers/test-app';

describe('Regions — публичный API (§A1)', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/regions', () => {
    it('TC-A1-01: возвращает массив items с подсчётом сущностей', async () => {
      const res = await request(app.server as any)
        .get('/api/v1/regions')
        .expect(200);

      expect(res.body).toHaveProperty('items');
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body).toHaveProperty('total');
      expect(typeof res.body.total).toBe('number');
    });

    it('TC-A1-02: каждый регион имеет id, name (uz/ru/en), slug и orderIdx', async () => {
      const res = await request(app.server as any)
        .get('/api/v1/regions')
        .expect(200);

      if (res.body.items.length === 0) {
        // База пустая — это допустимо в чистом окружении, но фиксируем как warning.
        console.warn(
          '[WARN] /regions вернул пустой массив. Запустите prisma seed чтобы заполнить.',
        );
        return;
      }

      for (const region of res.body.items) {
        expect(region).toHaveProperty('id');
        expect(typeof region.id).toBe('string');
        expect(region).toHaveProperty('slug');
        expect(typeof region.slug).toBe('string');
        expect(region).toHaveProperty('name');
        // name — JSONB {uz, ru, en}
        expect(typeof region.name).toBe('object');
        expect(region.name).toHaveProperty('uz');
        expect(region.name).toHaveProperty('ru');
        expect(region.name).toHaveProperty('en');
        expect(region).toHaveProperty('orderIdx');
        // _count нужен админке (`use-regions`) и landing для счётчиков
        expect(region).toHaveProperty('_count');
        expect(region._count).toHaveProperty('museums');
        expect(region._count).toHaveProperty('historicalPlaces');
      }
    });

    it('TC-A1-03: regions упорядочены по orderIdx (asc)', async () => {
      const res = await request(app.server as any)
        .get('/api/v1/regions')
        .expect(200);

      const order = res.body.items.map((r: { orderIdx: number }) => r.orderIdx);
      const sorted = [...order].sort((a, b) => a - b);
      expect(order).toEqual(sorted);
    });

    it('TC-A1-04: фильтр ?search по подстроке имени работает', async () => {
      // Если базы нет — пропускаем, иначе берём первое имя
      const all = await request(app.server as any)
        .get('/api/v1/regions')
        .expect(200);
      if (all.body.items.length === 0) return;

      const sample = all.body.items[0].name.ru || all.body.items[0].name.uz;
      const needle = (sample as string).slice(0, 3);

      const filtered = await request(app.server as any)
        .get(`/api/v1/regions?search=${encodeURIComponent(needle)}`)
        .expect(200);

      expect(filtered.body.items.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/regions/:id', () => {
    it('TC-A1-10: 400 на невалидный UUID', () =>
      request(app.server as any)
        .get('/api/v1/regions/not-a-uuid')
        .expect(400));

    it('TC-A1-11: 404 на несуществующий, но валидный UUID', () =>
      request(app.server as any)
        .get('/api/v1/regions/00000000-0000-0000-0000-000000000000')
        .expect(404));

    it('TC-A1-12: для существующего id возвращает полный объект', async () => {
      const list = await request(app.server as any).get('/api/v1/regions');
      if (list.body.items.length === 0) return;

      const first = list.body.items[0];
      const res = await request(app.server as any)
        .get(`/api/v1/regions/${first.id}`)
        .expect(200);

      // Ответ обёрнут в {data: ...} интерсептором (одиночные GET не raw)
      const data = res.body.data ?? res.body;
      expect(data).toHaveProperty('id', first.id);
      expect(data.name).toHaveProperty('uz');
      expect(data.name).toHaveProperty('ru');
      expect(data.name).toHaveProperty('en');
    });
  });
});
