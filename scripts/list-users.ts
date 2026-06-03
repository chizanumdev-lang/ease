import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const users = await usersService.findAll();
  console.log('All Users:', users.map(u => ({ id: u.id, email: u.email, isVerified: u.isVerified })));
  await app.close();
}
bootstrap();
