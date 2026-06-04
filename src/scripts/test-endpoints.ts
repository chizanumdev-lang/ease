import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ProgramsService } from '../programs/programs.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { RitualsService } from '../audio/rituals.service';
import { INestApplicationContext } from '@nestjs/common';

async function test() {
  const app: INestApplicationContext =
    await NestFactory.createApplicationContext(AppModule);

  const programsService = app.get(ProgramsService);
  const analyticsService = app.get(AnalyticsService);
  const ritualsService = app.get(RitualsService);

  const userId = '8b45638a-3601-4475-802c-88e894b9015c'; // ichizanum@gmail.com or some random ID

  console.log('--- TESTING ENDPOINTS FOR USER WITH NO PROGRAM ---');

  try {
    console.log('\n1. Testing ProgramsService.findActive...');
    try {
      await programsService.findActive(userId);
      console.log('Result: Found program (unexpected if no program exists)');
    } catch (e) {
      console.log('Result: Caught error:', e.constructor.name, e.message);
    }

    console.log('\n2. Testing AnalyticsService.getWeeklyAnalytics...');
    try {
      const result = await analyticsService.getWeeklyAnalytics(userId);
      console.log('Result: Success! Completion rate:', result.completionRate);
    } catch (e) {
      console.log('Result: Caught error:', e.constructor.name, e.message);
    }

    console.log('\n3. Testing RitualsService.findByDate...');
    try {
      const result = await ritualsService.findByProgram('test-program-id');
      console.log('Result: Success! Rituals found:', result.length);
    } catch (e) {
      console.log('Result: Caught error:', e.constructor.name, e.message);
    }
  } catch (error) {
    console.error('Fatal Test Error:', error);
  } finally {
    await app.close();
  }
}

test();
