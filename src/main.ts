import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as dns from 'dns';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { Express } from 'express';

dns.setDefaultResultOrder('ipv4first');

console.log('--- STARTING VERCEL BOOTSTRAP (v1.0.8-OPTIMIZED) ---');

// Initialize Sentry before everything else
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
});

let cachedApp: INestApplication;

async function bootstrap(): Promise<INestApplication> {
  if (!cachedApp) {
    console.log('Initializing Nest application (v1.0.8-OPTIMIZED)...');
    cachedApp = await NestFactory.create(AppModule);

    // Enable CORS
    cachedApp.enableCors();

    // Global validation pipe
    cachedApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Set global prefix
    cachedApp.setGlobalPrefix('api', { exclude: ['/', 'health', ''] });

    await cachedApp.init();
  }
  return cachedApp;
}

// For Vercel Serverless environment
export default async (req: any, res: any) => {
  try {
    const app = await bootstrap();
    const instance = app.getHttpAdapter().getInstance();
    return instance(req, res);
  } catch (err) {
    console.error('Vercel Handler Error:', err);
    res.status(500).send('Internal Server Error during bootstrap');
  }
};

// For local development or non-Vercel environments
if (!process.env.VERCEL) {
  bootstrap().then(async (app) => {
    const port = process.env.PORT ?? 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: http://localhost:${port}`);
  });
}
