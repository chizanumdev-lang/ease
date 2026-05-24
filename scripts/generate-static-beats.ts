import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AudioMixerService } from '../src/audio/audio-mixer.service';
import { AudioService } from '../src/audio/audio.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const mixer = app.get(AudioMixerService);
  const audioService = app.get(AudioService);

  const frequencies = [
    { name: 'delta_4hz', val: 4 },
    { name: 'theta_6hz', val: 6 },
    { name: 'alpha_10hz', val: 10 },
    { name: 'beta_15hz', val: 15 },
    { name: 'beta_20hz', val: 20 },
    { name: 'gamma_25hz', val: 25 },
  ];

  console.log('Starting pre-generation of binaural beats...');

  for (const f of frequencies) {
    console.log(`Generating ${f.name} (${f.val}Hz)...`);
    const filename = `static_binaural_${f.val}hz`;
    const tempPath = path.join(os.tmpdir(), `${filename}.wav`);

    // Generate
    const buffer = await mixer.generateBinauralBeat({
      frequency: f.val,
      carrierFreq: 200,
      duration: 1, // 1 minute is plenty for test
      fadeIn: 2,
      fadeOut: 2,
    });

    // Save
    fs.writeFileSync(tempPath, buffer);

    // Upload
    const url = await audioService.uploadToCloudinary(tempPath, filename);
    console.log(`Uploaded ${f.name}: ${url}`);

    // Cleanup
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }

  console.log('Pre-generation complete!');
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Generation failed:', err);
  process.exit(1);
});
