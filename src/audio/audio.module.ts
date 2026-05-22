import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudioService } from './audio.service';
import { AudioController } from './audio.controller';
import { AudioResolver } from './audio.resolver';

import { AiModule } from '../ai/ai.module';
import { AudioTrack } from './entities/audio-track.entity';
import { RitualTrack } from './entities/ritual-track.entity';
import { AudioMixerService } from './audio-mixer.service';
import { YoutubeAudioService } from './youtube-audio.service';
import { VideoModule } from '../video/video.module';
import { UsersModule } from '../users/users.module';

import { Program } from '../programs/entities/program.entity';
import { RitualsService } from './rituals.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AudioTrack, RitualTrack, Program]),
    AiModule,
    VideoModule,
    UsersModule,
  ],
  controllers: [AudioController],
  providers: [
    AudioService,
    AudioMixerService,
    RitualsService,
    YoutubeAudioService,
    AudioResolver,
  ],
  exports: [
    AudioService,
    AudioMixerService,
    RitualsService,
    YoutubeAudioService,
  ],
})
export class AudioModule {}
