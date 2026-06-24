// Debe ir antes que cualquier otro import: fija la zona horaria del proceso.
import './config/app-timezone';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { getCorsOrigins, isSwaggerEnabled } from './config/environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: getCorsOrigins(),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // Elimina propiedades no definidas en los DTOs
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API REST - Sistema de gestión de citas')
    .setDescription(
      'Documentación OpenAPI de la API REST utilizada por la aplicación web de gestión de citas.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  if (isSwaggerEnabled()) {
    SwaggerModule.setup('api/docs', app, swaggerDocument, {
      jsonDocumentUrl: 'api/docs-json',
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
