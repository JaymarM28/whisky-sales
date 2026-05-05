import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.use(helmet());

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Whisky Sales Manager API')
      .setDescription('API REST para gestión de ventas de licores premium')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'JWT',
      )
      .build();
    const document = SwaggerModule.createDocument(app as any, swaggerConfig);
    SwaggerModule.setup('docs', app as any, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    console.log(`Swagger disponible en http://localhost:${process.env.PORT || 3000}/docs`);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim());

  const isProd = process.env.NODE_ENV === 'production';
  app.enableCors({
    origin: (origin, callback) => {
      if ((!origin && !isProd) || allowedOrigins.includes(origin ?? '')) {
        callback(null, true);
      } else {
        callback(new Error(`Origen no permitido: ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Servidor corriendo en http://localhost:${port}/api`);
}

bootstrap();
