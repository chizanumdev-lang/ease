import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

console.log('--- STARTING VERCEL BOOTSTRAP (v1.0.7-VOLUME-ADJUSTED) ---');

// Initialize Sentry before everything else
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
});

async function bootstrap() {
  console.log('Initializing Nest application (v1.0.7-VOLUME-ADJUSTED)...');
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

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
