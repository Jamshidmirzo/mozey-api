import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health', () => {
    it('GET /api/v1/health should return ok', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.timestamp).toBeDefined();
          expect(res.body.database).toBeDefined();
        });
    });
  });

  describe('Auth', () => {
    it('POST /api/v1/auth/device should register a device', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/device')
        .send({
          deviceId: 'test-device-e2e-001',
          locale: 'uz',
          appVersion: '2.0.0',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.token).toBeDefined();
          expect(res.body.data.userId).toBeDefined();
        });
    });

    it('POST /api/v1/auth/device should be idempotent', async () => {
      const payload = {
        deviceId: 'test-device-e2e-002',
        locale: 'ru',
        appVersion: '2.0.0',
      };

      const first = await request(app.getHttpServer())
        .post('/api/v1/auth/device')
        .send(payload)
        .expect(201);

      const second = await request(app.getHttpServer())
        .post('/api/v1/auth/device')
        .send(payload)
        .expect(201);

      expect(first.body.data.userId).toBe(second.body.data.userId);
    });

    it('POST /api/v1/auth/device should reject invalid payload', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/device')
        .send({})
        .expect(400);
    });
  });

  describe('Museums (public)', () => {
    it('GET /api/v1/museums should return a list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/museums')
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toBeDefined();
          expect(Array.isArray(res.body.items)).toBe(true);
          expect(res.body.serverTime).toBeDefined();
        });
    });

    it('GET /api/v1/museums with since should return delta format', () => {
      return request(app.getHttpServer())
        .get('/api/v1/museums?since=2020-01-01T00:00:00.000Z')
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toBeDefined();
          expect(res.body.deleted).toBeDefined();
          expect(res.body.nextSince).toBeDefined();
        });
    });

    it('GET /api/v1/museums/:id should return 404 for non-existent UUID', () => {
      return request(app.getHttpServer())
        .get('/api/v1/museums/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('GET /api/v1/museums/:id should return 400 for invalid UUID', () => {
      return request(app.getHttpServer())
        .get('/api/v1/museums/not-a-uuid')
        .expect(400);
    });
  });

  describe('Historical Places (public)', () => {
    it('GET /api/v1/historical-places should return a list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/historical-places')
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toBeDefined();
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });
  });

  describe('Sync', () => {
    it('GET /api/v1/sync/manifest should return manifest', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sync/manifest')
        .expect(200)
        .expect((res) => {
          expect(res.body.museums).toBeDefined();
          expect(res.body.historicalPlaces).toBeDefined();
          expect(res.body.serverTime).toBeDefined();
        });
    });

    it('POST /api/v1/sync/actions should require auth', () => {
      return request(app.getHttpServer())
        .post('/api/v1/sync/actions')
        .send({ actions: [] })
        .expect(401);
    });
  });

  describe('Admin Auth', () => {
    it('POST /api/v1/admin/auth/login should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/admin/auth/login')
        .send({
          email: 'nonexistent@mozey.uz',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('POST /api/v1/admin/auth/login should reject invalid payload', () => {
      return request(app.getHttpServer())
        .post('/api/v1/admin/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('Admin endpoints (no auth)', () => {
    it('GET /api/v1/admin/museums should require auth', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/museums')
        .expect(401);
    });

    it('GET /api/v1/admin/audit-log should require auth', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/audit-log')
        .expect(401);
    });

    it('GET /api/v1/admin/admins should require auth', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/admins')
        .expect(401);
    });
  });
});
