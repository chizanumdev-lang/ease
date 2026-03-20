import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudioService } from './audio.service';
import { AudioController } from './audio.controller';
import { AiModule } from '../ai/ai.module';
import { AudioTrack } from './entities/audio-track.entity';
import { AudioProcessor } from './audio.processor';
import { AudioMixerService } from './audio-mixer.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([AudioTrack]),
        AiModule
    ],
    controllers: [AudioController],
    providers: [AudioService, AudioProcessor, AudioMixerService],
    exports: [AudioService, AudioMixerService],
})
export class AudioModule { }
