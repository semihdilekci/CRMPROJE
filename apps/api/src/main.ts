import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as path from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.use(helmet());

  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']
        : true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = Number(process.env.PORT) || 3001;
  /** 0.0.0.0: LAN üzerinden fiziksel telefon / emülatörden erişim (yalnızca 127.0.0.1 dinlenirse mobil test edilemez) */
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);

  Logger.log(
    `API running on http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/api/v1 (bound ${host}:${port})`,
    'Bootstrap',
  );
}

bootstrap();
