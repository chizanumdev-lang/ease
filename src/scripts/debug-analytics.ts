
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AnalyticsService } from '../analytics/analytics.service';
import { UsersService } from '../users/users.service';

async function debugAnalytics() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const analyticsService = app.get(AnalyticsService);
  const usersService = app.get(UsersService);

  const adminEmail = 'ichizanum@gmail.com';
  const user = await usersService.findByEmail(adminEmail);

  if (!user) {
    console.error(`User ${adminEmail} not found`);
    await app.close();
    return;
  }

  console.log(`Testing analytics for user: ${user.id} (${user.email})`);

  try {
    const analytics = await analyticsService.getWeeklyAnalytics(user.id);
    console.log('Analytics Success:', JSON.stringify(analytics, null, 2));
  } catch (err: any) {
    console.error('Analytics Failed!');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
  }

  await app.close();
}

debugAnalytics();
