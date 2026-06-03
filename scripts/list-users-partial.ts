import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const users = await usersService.findAll();
  console.log('All Users:', users.map(u => ({ id: u.id, email: u.email, isVerified: u.isVerified })));
  
  const matches = users.filter(u => u.email.includes('obiefun'));
  if (matches.length > 0) {
      console.log('Matched users:', matches.map(u => u.email));
      for (const u of matches) {
          await usersService.skipVerification(u.email);
          console.log(`Verified ${u.email}`);
      }
  } else {
      console.log('No matches for obiefun');
  }
  await app.close();
}
bootstrap();
