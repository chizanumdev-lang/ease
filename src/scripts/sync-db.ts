import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function sync() {
  console.log('Bootstrapping app to sync database...');
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  console.log('Synchronizing database schema...');
  await dataSource.synchronize();
  console.log('Database synchronization complete!');

  await app.close();
}

sync().catch((err) => {
  console.error('Synchronization failed:', err);
  process.exit(1);
});
