import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const email = 'obiefunalbertgeorge@gmail.com';
  console.log(`Note: Email verification for ${email} is now handled by Supabase Auth.`);
  console.log('Use the Supabase dashboard to confirm users manually, or rely on the confirmation email flow.');
  await app.close();
}
bootstrap();
