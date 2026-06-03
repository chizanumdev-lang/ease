import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const email = 'obiefunalbertgeorge@gmail.com';
  console.log(`Verifying user ${email}...`);
  try {
    const user = await usersService.skipVerification(email);
    console.log('User verified successfully:', user.id, user.email);
  } catch (error) {
    console.error('Failed to verify user:', error.message);
  }
  await app.close();
}
bootstrap();
