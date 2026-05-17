import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiGenerationLog } from './src/admin/entities/ai-generation-log.entity';
import { Repository } from 'typeorm';

async function checkLogs() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logRepo = app.get<Repository<AiGenerationLog>>(getRepositoryToken(AiGenerationLog));

  const log = await logRepo.findOne({
    order: { createdAt: 'DESC' }
  });

  if (log) {
    console.log('--- LAST AI LOG ---');
    console.log(`Status: ${log.status}`);
    console.log(`Model: ${log.model}`);
    console.log(`Prompt Start: ${log.prompt.substring(0, 200)}...`);
    console.log(`Response: ${log.response}`);
    console.log(`Error: ${log.errorMessage}`);
  } else {
    console.log('No AI logs found.');
  }

  await app.close();
}

checkLogs().catch(err => {
  console.error('Check failed:', err);
  process.exit(1);
});
