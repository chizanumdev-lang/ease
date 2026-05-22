import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminService } from '../admin/admin.service';

async function debugTrends() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminService = app.get(AdminService);

  console.log('Testing Admin Trends...');

  try {
    const trends = await adminService.getTrends();
    console.log('Trends Success:', JSON.stringify(trends, null, 2));
  } catch (err: any) {
    console.error('Trends Failed!');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
  }

  await app.close();
}

debugTrends();
