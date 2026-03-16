import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudioService } from './audio.service';
import { AudioController } from './audio.controller';
import { AiModule } from '../ai/ai.module';
import { AudioTrack } from './entities/audio-track.entity';
import { AudioProcessor } from './audio.processor';

@Module({
    imports: [
        TypeOrmModule.forFeature([AudioTrack]),
        AiModule
    ],
    controllers: [AudioController],
    providers: [AudioService, AudioProcessor],
    exports: [AudioService],
})
export class AudioModule { }
