import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RitualsService } from './rituals.service';
import { AudioService } from './audio.service';
import { AudioMixerService } from './audio-mixer.service';
import {
  DailyRitualsResponse,
  AudioUrlResponse,
  ImmersiveTestResponse,
} from './dto/audio-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver()
export class AudioResolver {
  constructor(
    private readonly ritualsService: RitualsService,
    private readonly audioService: AudioService,
    private readonly audioMixerService: AudioMixerService,
  ) {}

  @Query(() => DailyRitualsResponse, { name: 'getRituals' })
  @UseGuards(JwtAuthGuard)
  async getRituals(
    @Args('date') clientDate: string,
    @GetUser() user: User,
  ): Promise<DailyRitualsResponse> {
    const program = await this.ritualsService.getActiveProgram(user.id);
    const date = program ? `program_${program.id}` : clientDate;

    const rituals = await this.ritualsService.findByDate(user.id, date);

    if (rituals.length === 0) {
      const claimed = await this.ritualsService.claimGeneration(user.id, date);
      if (claimed) {
        this.ritualsService.generateDailyRituals(user.id, date).catch(() => {});
      }
      return { status: 'generating' };
    }

    const allReady = rituals.every((r) => r.url && r.url.length > 0);
    return {
      morning: rituals.find((r) => r.ritualType === 'morning'),
      night: rituals.find((r) => r.ritualType === 'night'),
      status: allReady ? 'ready' : 'generating',
    };
  }

  @Mutation(() => AudioUrlResponse)
  @UseGuards(JwtAuthGuard)
  async generateBinauralPreview(
    @Args('frequency') frequency: number,
  ): Promise<AudioUrlResponse> {
    // Simplified version of the logic in AudioController
    const filename = `binaural_${frequency}hz_${Date.now()}`;
    const buffer = await this.audioMixerService.generateBinauralBeat({
      frequency,
      carrierFreq: 200,
      duration: 30,
      fadeIn: 5,
      fadeOut: 5,
    });

    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const tempPath = path.join(os.tmpdir(), `${filename}.wav`);
    fs.writeFileSync(tempPath, buffer);

    const audioUrl = await this.audioService.uploadToCloudinary(
      tempPath,
      filename,
    );
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    return { url: audioUrl };
  }
}
