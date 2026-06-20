/**
 * §G. Gap-спецификации.
 *
 * Эти тесты сейчас зелёные ровно потому что описывают функциональность,
 * КОТОРОЙ НЕТ. Они помечены `it.skip` с подробным TODO и активируются как
 * только соответствующая фича появится. Это эквивалент "spec as a TODO":
 * любой разработчик, читающий этот файл, видит, чего не хватает.
 */
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers/test-app';

describe('§G. Gap-спецификации (пока не реализовано)', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GAP-001: Внешние ссылки музея (MuseumLink)', () => {
    /*
      Пользователь просит CRUD «ссылок на музеи (внешние URL — сайт, соцсети)»
      через админку. В prisma/schema.prisma модели нет.

      Ожидаемая модель:
        model MuseumLink {
          id        String   @id @default(uuid()) @db.Uuid
          museumId  String
          kind      String   // website | facebook | instagram | telegram | ...
          url       String
          orderIdx  Int      @default(0)
          createdAt DateTime @default(now())
          museum    Museum   @relation(...)
        }

      Ожидаемые эндпоинты:
        GET    /museums/:id  → museum.links: Link[]
        POST   /admin/museums/:id/links
        PATCH  /admin/links/:id
        DELETE /admin/links/:id
    */
    it.skip('TC-G-01: GET /museums/:id содержит поле links[]', async () => {
      const list = await request(app.server as any).get('/api/v1/museums?limit=1');
      const first = list.body.items[0];
      if (!first) return;
      const res = await request(app.server as any).get(
        `/api/v1/museums/${first.id}`,
      );
      const data = res.body.data ?? res.body;
      expect(data).toHaveProperty('links');
      expect(Array.isArray(data.links)).toBe(true);
    });

    it.skip('TC-G-02: POST /admin/museums/:id/links создаёт ссылку с url + kind', () => {
      // TODO: реализовать когда добавится MuseumLink
    });

    it.skip('TC-G-03: DELETE /admin/links/:id удаляет', () => {});

    it.skip('TC-G-04: URL валидируется (https-only, валидный URL)', () => {});
  });

  describe('GAP-002: NotificationsModule', () => {
    /*
      В брифе сказано «API недавно получил NotificationsModule», но в
      `api/src/app.module.ts` модуля нет (см. строки 1–40).

      Ожидаемые эндпоинты:
        POST /admin/notifications      — broadcast push
        GET  /admin/notifications      — история
        POST /admin/notifications/:id/cancel
    */
    it.skip('TC-G-10: GET /admin/notifications с токеном возвращает items[]', () => {});
    it.skip('TC-G-11: POST /admin/notifications триггерит FCM-шину', () => {});
  });

  describe('GAP-003: Multi-locale через Accept-Language', () => {
    /*
      Сейчас name/description возвращаются как JSONB {uz, ru, en} и клиент сам выбирает язык.
      Это допустимо, но если будет принят контракт «server picks language by Accept-Language»
      и вернёт {name: "uz string"} — мобайл и landing сразу сломаются (они ждут объект).

      Спецификация: контракт «JSONB наружу» зафиксирован.
    */
    it('TC-G-20: name НЕ свёрнут в строку при Accept-Language: uz', async () => {
      const list = await request(app.server as any)
        .get('/api/v1/museums?limit=1')
        .set('Accept-Language', 'uz');
      if (list.body.items.length === 0) return;
      expect(typeof list.body.items[0].name).toBe('object');
      expect(list.body.items[0].name).toHaveProperty('uz');
    });
  });
});
