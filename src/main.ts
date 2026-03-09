import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

console.log('--- STARTING VERCEL BOOTSTRAP ---');

async function bootstrap() {
  console.log('Initializing Nest application (v1.0.1)...');
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Set global prefix
  app.setGlobalPrefix('api', { exclude: ['/', 'health', ''] });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
