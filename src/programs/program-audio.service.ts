import { AudioTrack } from '../audio/entities/audio-track.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DayPlan } from './entities/day-plan.entity';
import { AiService } from '../ai/ai.service';
import { AudioService } from '../audio/audio.service';
import { AudioMixerService } from '../audio/audio-mixer.service';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const AUDIO_TRACKS: Record<string, string[]> = {
  meditation: [
    'https://res.cloudinary.com/duooultxc/video/upload/v1774276955/ease/audio/static_binaural_4hz.mp3',
    'https://res.cloudinary.com/duooultxc/video/upload/v1774269228/ease/audio/static_binaural_6hz.mp3',
  ],
  focus: [
    'https://res.cloudinary.com/duooultxc/video/upload/v1774269306/ease/audio/static_binaural_10hz.mp3',
    'https://res.cloudinary.com/duooultxc/video/upload/v1774277400/ease/audio/static_binaural_15hz.mp3',
  ],
  ambient: [
    'https://res.cloudinary.com/duooultxc/video/upload/v1774269382/ease/audio/static_binaural_20hz.mp3',
  ],
};

function pickAudioUrl(mood: string, dayNumber: number): string {
  const tracks = AUDIO_TRACKS[mood] ?? AUDIO_TRACKS['meditation'];
  return tracks[(dayNumber - 1) % tracks.length];
}

@Injectable()
export class ProgramAudioService {
  private readonly logger = new Logger(ProgramAudioService.name);

  constructor(
    @InjectRepository(DayPlan) private dayPlanRepository: Repository<DayPlan>,
    private aiService: AiService,
    private audioService: AudioService,
    private audioMixerService: AudioMixerService,
  ) {}

  async generateAudioTrack(
    audioTrackId: string,
    theme: string,
    audioFilename: string,
  ): Promise<any> {
    this.logger.log(`Generating audio for track ${audioTrackId} (theme: ${theme})`);
    try {
      const track = await this.audioService.getAudioTrack(audioTrackId);
      if (!track) {
        this.logger.warn(`AudioTrack ${audioTrackId} not found in DB`);
        return { success: false, reason: 'not_found' };
      }

      if (
        track.url &&
        track.url !== 'generating...' &&
        track.url !== '' &&
        !track.url.includes('pixabay.com') &&
        !track.url.includes('static_binaural')
      ) {
        this.logger.log(`Audio track ${audioTrackId} already generated, skipping`);
        return { success: true, url: track.url };
      }

      track.url = 'generating...';
      await this.audioService.updateAudioTrack(track);

      const scriptData = await this.aiService.generateAudioScript(theme, 5, 'task');

      const tempDir = path.join(os.tmpdir(), 'ease-audio-binaural');
      const audioPath = await this.audioMixerService.createBinauralSubliminalTrack(scriptData, tempDir);

      const publicUrl = await this.audioService.uploadToCloudinary(audioPath, audioFilename);

      track.url = publicUrl;
      track.type = scriptData.sessionType;
      track.metadata = {
        sessionType: scriptData.sessionType,
        frequency: scriptData.binauralFrequency,
        affirmations: scriptData.affirmations,
      };
      await this.audioService.updateAudioTrack(track);
      this.logger.log(`Successfully generated and saved binaural track ${audioTrackId}`);

      try {
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      } catch (err: any) {
        this.logger.warn(`Failed to cleanup temp file: ${audioPath}`, err);
      }

      return { success: true, url: publicUrl };
    } catch (error: any) {
      this.logger.error(`Failed to generate audio track ${audioTrackId}: ${error.message}`);
      const track = await this.audioService.getAudioTrack(audioTrackId);
      if (track) {
        const mood = track.type || 'meditation';
        const dayNumber = track.dayPlanId
          ? (await this.dayPlanRepository.findOne({ where: { id: track.dayPlanId } }))?.dayNumber || 1
          : 1;
        track.url = pickAudioUrl(mood, dayNumber);
        await this.audioService.updateAudioTrack(track);
      }
      return { success: false, error: error.message };
    }
  }
}
