import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminService } from '../admin/admin.service';

async function debugPulse() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminService = app.get(AdminService);

  console.log('Testing Admin Dashboard Pulse...');

  try {
    const pulse = await adminService.getDashboardPulse();
    console.log('Pulse Success:', JSON.stringify(pulse, null, 2));
  } catch (err: any) {
    console.error('Pulse Failed!');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
  }

  await app.close();
}

debugPulse();
