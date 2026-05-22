import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiGenerationLog } from '../admin/entities/ai-generation-log.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([AiGenerationLog])],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
