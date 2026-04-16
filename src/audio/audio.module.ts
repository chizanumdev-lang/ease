import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudioService } from './audio.service';
import { AudioController } from './audio.controller';
import { AiModule } from '../ai/ai.module';
import { AudioTrack } from './entities/audio-track.entity';
import { RitualTrack } from './entities/ritual-track.entity';
import { AudioProcessor } from './audio.processor';
import { AudioMixerService } from './audio-mixer.service';

import { Program } from '../programs/entities/program.entity';
import { RitualsService } from './rituals.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([AudioTrack, RitualTrack, Program]),
        AiModule
    ],
    controllers: [AudioController],
    providers: [AudioService, AudioProcessor, AudioMixerService, RitualsService],
    exports: [AudioService, AudioMixerService, RitualsService],
})
export class AudioModule { }
