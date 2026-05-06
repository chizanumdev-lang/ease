
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminService } from './admin.service';

async function testPulse() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const adminService = app.get(AdminService);

  console.log('Testing AdminService.getDashboardPulse...');
  try {
    const pulse = await adminService.getDashboardPulse();
    console.log('Pulse Data:', JSON.stringify(pulse, null, 2));
    console.log('\nSuccess!');
  } catch (error) {
    console.error('Pulse Failed:', error);
  }

  await app.close();
}

testPulse();
