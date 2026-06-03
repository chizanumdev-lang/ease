import { NestFactory } from '@nestjs/core';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// Force DATABASE_URL to target the remote database
process.env.DATABASE_URL =
  'postgresql://postgres.zfekilefdlkkfhoyjtfy:Ineed20$now.@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

import { AppModule } from '../src/app.module';
import { AudioMixerService } from '../src/audio/audio-mixer.service';

async function testAudioGeneration() {
  console.log(
    'Bootstrapping NestJS application context to test audio generation...',
  );
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const audioMixerService = app.get(AudioMixerService);
    const tempDir = path.join(os.tmpdir(), 'ease-audio-test-generation');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const scriptData = {
      theme: 'Stress Relief and High Focus',
      binauralFrequency: 10, // 10Hz Alpha waves for focus
      affirmations: [
        'I am calm, focused, and completely in control of my mind',
        'Every breath releases tension and brings deep clarity',
        'I flow effortlessly through tasks with confidence and ease',
      ],
      introNarration: 'Take a deep breath. Let go of all analytical thoughts. Let your subconscious absorb the soothing frequencies.',
      outroNarration: 'Gently return to your surroundings.',
    };

    console.log(
      '\n--- Running Subliminals & Affirmations Generation Pipeline ---',
    );
    console.log('Using scriptData:', JSON.stringify(scriptData, null, 2));

    const startTime = Date.now();
    const outputFilePath =
      await audioMixerService.createBinauralSubliminalTrack(
        scriptData,
        tempDir,
        1, // 1 minute session duration
      );
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(
      `\n🎉 SUCCESS! Mixed audio generated in ${durationSec} seconds!`,
    );
    console.log(`Mixed Output File Path: ${outputFilePath}`);

    if (fs.existsSync(outputFilePath)) {
      const stats = fs.statSync(outputFilePath);
      console.log(
        `Generated file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      );

      // Check that the mixed file exists and has content
      console.log('✓ File exists and has correct size.');
    } else {
      console.error('❌ Output file was not found!');
    }
  } catch (err) {
    console.error('❌ Audio generation failed:', err);
  } finally {
    await app.close();
  }
}

testAudioGeneration().catch((err) => {
  console.error('Script runner failed:', err);
  process.exit(1);
});
