import { Module } from '@nestjs/common';
import { YoutubeService } from './youtube/youtube.service';
import { VideoController } from './video.controller';
import { AiModule } from '../ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [AiModule, ConfigModule, CacheModule.register()],
  providers: [YoutubeService],
  controllers: [VideoController],
  exports: [YoutubeService],
})
export class VideoModule {}
