import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AudioService } from '../audio/audio.service';

async function generateTestAudio() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const audioService = app.get(AudioService);

    const script = "Le chat curieux regardait le coucher de soleil doré depuis le haut balcon.";
    const filename = "speaking_test_french";
    
    console.log('--- STARTING SLOW AI FRENCH AUDIO GENERATION (-25%) ---');
    try {
        const url = await audioService.generateAudioTrack(script, 'french', filename, true, '-25%');
        console.log('\nSUCCESS! YOUR AI GENERATED URL IS:');
        console.log(url);
        console.log('\n--- END ---');
    } catch (error) {
        console.error('FAILED TO GENERATE AUDIO:', error);
    } finally {
        await app.close();
    }
}

generateTestAudio();
