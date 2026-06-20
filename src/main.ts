import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS — build the allowed-origins list from multiple sources so that
  // production domains are always included even if the .env on the droplet
  // is incomplete.
  const originsFromEnv = process.env.CORS_ORIGINS?.split(',').map((o) =>
    o.trim(),
  ) || [];

  const extraOrigins = [
    process.env.ADMIN_URL,
    process.env.LANDING_URL,
    process.env.API_URL,
  ].filter(Boolean) as string[];

  // Production domains — always allowed so a missing env var never locks out
  // the admin panel.
  const productionOrigins = [
    'https://admin.mozey.uz',
    'https://mozey.uz',
    'https://api.mozey.uz',
  ];

  // Dev defaults
  const devOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3100',
    'http://localhost:3200',
    'http://localhost:3030',
    'http://localhost:3333',
  ];

  const allOrigins = [
    ...new Set([
      ...originsFromEnv,
      ...extraOrigins,
      ...productionOrigins,
      ...devOrigins,
    ]),
  ];

  logger.log(`CORS allowed origins: ${allOrigins.join(', ')}`);

  app.enableCors({
    origin: allOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
    maxAge: 86400, // cache preflight for 24h
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Mozey API')
      .setDescription(
        'Backend API for the museum content platform. Supports delta sync, admin CRUD, and device auth.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'app-token',
      )
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'admin-token',
      )
      .addTag('Health', 'Health check')
      .addTag('Auth', 'Device authentication')
      .addTag('Museums', 'Public museum endpoints')
      .addTag('Historical Places', 'Public historical places endpoints')
      .addTag('Sync', 'Offline sync endpoints')
      .addTag('Admin Auth', 'Admin authentication')
      .addTag('Admin Museums', 'Museum management')
      .addTag('Admin Historical Places', 'Historical places management')
      .addTag('Admin Users', 'Admin user management')
      .addTag('Audit Log', 'Audit log viewer')
      .addTag('Upload', 'File upload (presigned URLs)')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger UI available at /api/docs');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
}

bootstrap();
