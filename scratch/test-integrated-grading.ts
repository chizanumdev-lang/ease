import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AiService } from '../src/ai/ai.service';
import * as fs from 'fs';
import * as path from 'path';

async function testIntegratedGrading() {
  console.log('Bootstrapping NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  console.log('Retrieving AiService...');
  const aiService = app.get(AiService);

  const audioPath = path.join(__dirname, '../test_say.aiff');
  if (!fs.existsSync(audioPath)) {
    console.error(`Audio file not found at ${audioPath}`);
    await app.close();
    return;
  }

  const audioBuffer = fs.readFileSync(audioPath);
  console.log(`Read test audio buffer: ${audioBuffer.length} bytes`);

  try {
    console.log('Invoking gradeVocalPerformance on NestJS AiService...');
    const result = await aiService.gradeVocalPerformance(
      audioBuffer,
      "Bonjour, c'est un test de la commande de l'audio génération.",
      "fr-FR",
      "audio/x-aiff"
    );
    console.log('\n--- INTEGRATED FALLBACK GRADING SUCCESS ---');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Integrated vocal grading failed:', error);
  } finally {
    await app.close();
  }
}

testIntegratedGrading().catch(err => {
  console.error('Integrated test setup failed:', err);
  process.exit(1);
});
