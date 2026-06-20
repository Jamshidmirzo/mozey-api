/**
 * §A2. Музеи — публичный контракт.
 *
 * Фиксируем: shape, который ждут mobile (`_mapApiToMuseumModel`) и landing
 * (`mapApiToItem`). Если форма изменится — оба клиента сломаются молча
 * (мобайл просто покажет пустой каталог), поэтому этот файл — наш ранний
 * детектор.
 */
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers/test-app';

describe('Museums — публичный API (§A2)', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/museums', () => {
    it('TC-A2-01: список содержит items[], total, serverTime, totalPages', async () => {
      const res = await request(app.server as any)
        .get('/api/v1/museums')
        .expect(200);

      // sync-shape: интерсептор пропускает «как есть» при наличии serverTime
      expect(res.body).toHaveProperty('items');
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('serverTime');
      expect(res.body).toHaveProperty('totalPages');
    });

    it('TC-A2-02: shape каждого музея совпадает с тем, что ждут mobile + landing', async () => {
      const res = await request(app.server as any)
        .get('/api/v1/museums?limit=5')
        .expect(200);

      if (res.body.items.length === 0) {
        console.warn('[WARN] /museums пустой. Запустите prisma seed.');
        return;
      }

      for (const m of res.body.items) {
        // Поля, которые читает mobile RemoteConfig._mapApiToMuseumModel
        expect(m).toHaveProperty('id');
        expect(m).toHaveProperty('name');
        expect(m).toHaveProperty('description');
        expect(m).toHaveProperty('ticketPrice');
        expect(m).toHaveProperty('latitude');
        expect(m).toHaveProperty('longitude');
        expect(m).toHaveProperty('city');
        expect(m).toHaveProperty('photos');
        // photos должны иметь {id, url, orderIdx} либо хотя бы url
        if (m.photos.length > 0) {
          expect(m.photos[0]).toHaveProperty('url');
        }
        // region включается даже если null
        expect(m).toHaveProperty('region');
        if (m.region) {
          expect(m.region).toHaveProperty('slug');
          expect(m.region).toHaveProperty('name');
        }

        // landing (web) дополнительно требует isPublished + deletedAt
        expect(m).toHaveProperty('isPublished');
        expect(m).toHaveProperty('deletedAt');
      }
    });

    it('TC-A2-03: показываются только опубликованные (isPublished=true)', async () => {
      const res = await request(app.server as any)
        .get('/api/v1/museums?limit=200')
        .expect(200);

      for (const m of res.body.items) {
        expect(m.isPublished).toBe(true);
      }
    });

    it('TC-A2-04: delta-sync через ?since= возвращает items + deleted + nextSince', async () => {
      const res = await request(app.server as any)
        .get('/api/v1/museums?since=2020-01-01T00:00:00.000Z')
        .expect(200);

      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('deleted');
      expect(Array.isArray(res.body.deleted)).toBe(true);
      expect(res.body).toHaveProperty('serverTime');
      expect(res.body).toHaveProperty('nextSince');
    });

    it('TC-A2-05: фильтр по regionId возвращает только музеи этого региона', async () => {
      const regions = await request(app.server as any).get('/api/v1/regions');
      if (regions.body.items.length === 0) return;
      const region = regions.body.items[0];

      const res = await request(app.server as any)
        .get(`/api/v1/museums?regionId=${region.id}&limit=100`)
        .expect(200);

      for (const m of res.body.items) {
        // Может быть null если музей вне региона, но фильтр обязан вернуть только эту привязку
        expect(m.regionId).toBe(region.id);
      }
    });

    it('TC-A2-06: ?limit=2 уважается', async () => {
      const res = await request(app.server as any)
        .get('/api/v1/museums?limit=2')
        .expect(200);
      expect(res.body.items.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /api/v1/museums/:id', () => {
    it('TC-A2-10: 400 на невалидный UUID', () =>
      request(app.server as any)
        .get('/api/v1/museums/not-a-uuid')
        .expect(400));

    it('TC-A2-11: 404 на несуществующий UUID', () =>
      request(app.server as any)
        .get('/api/v1/museums/00000000-0000-0000-0000-000000000000')
        .expect(404));
  });
});
