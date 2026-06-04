import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RitualTrack } from './entities/ritual-track.entity';
import { AiService } from '../ai/ai.service';
import { AudioService } from './audio.service';
import { AudioMixerService } from './audio-mixer.service';
import { YoutubeService } from '../video/youtube/youtube.service';
import { YoutubeAudioService } from './youtube-audio.service';
import { UsersService } from '../users/users.service';
import { Program } from '../programs/entities/program.entity';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

@Injectable()
export class RitualsService {
  private readonly logger = new Logger(RitualsService.name);

  constructor(
    @InjectRepository(RitualTrack)
    private ritualTrackRepository: Repository<RitualTrack>,
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    private aiService: AiService,
    private audioService: AudioService,
    private audioMixerService: AudioMixerService,
    private youtubeService: YoutubeService,
    private youtubeAudioService: YoutubeAudioService,
    private usersService: UsersService,
  ) {}

  /**
   * Distributed lock using the DB. Returns true if this caller "won" the
   * generation slot; false if another serverless instance already claimed it.
   */
  async claimGeneration(programId: string): Promise<boolean> {
    const existing = await this.ritualTrackRepository.find({
      where: { programId },
    });
    
    const hasMorning = existing.some(r => r.ritualType === 'morning');
    const hasNight = existing.some(r => r.ritualType === 'night');

    if (hasMorning && hasNight) return false;

    const placeholders: any[] = [];
    if (!hasMorning) {
      placeholders.push(this.ritualTrackRepository.create({
        programId,
        ritualType: 'morning',
        title: 'Generating...',
        url: '',
        duration: 1800,
        metadata: { status: 'generating' },
      }));
    }
    
    if (!hasNight) {
      placeholders.push(this.ritualTrackRepository.create({
        programId,
        ritualType: 'night',
        title: 'Generating...',
        url: '',
        duration: 3600,
        metadata: { status: 'generating' },
      }));
    }

    try {
      await this.ritualTrackRepository.save(placeholders);
      this.logger.log(`Claimed generation slot for missing rituals in program ${programId}`);
      return true;
    } catch (err) {
      // Unique constraint violation = another instance won the race
      this.logger.debug(
        `Generation slot already claimed for program ${programId}: ${err.message}`,
      );
      return false;
    }
  }

  async generateProgramRituals(
    programId: string,
  ): Promise<{ morning: RitualTrack | null; night: RitualTrack | null }> {
    this.logger.log(`Generating program rituals for program ${programId}`);

    const existing = await this.ritualTrackRepository.find({
      where: { programId },
    });
    
    const hasValidMorning = existing.some(r => r.ritualType === 'morning' && r.url && r.url.length > 0);
    const hasValidNight = existing.some(r => r.ritualType === 'night' && r.url && r.url.length > 0);

    const promises: Promise<any>[] = [];
    
    if (!hasValidMorning) promises.push(this.generateRitual(programId, 'morning'));
    else promises.push(Promise.resolve(existing.find(r => r.ritualType === 'morning')));
    
    if (!hasValidNight) promises.push(this.generateRitual(programId, 'night'));
    else promises.push(Promise.resolve(existing.find(r => r.ritualType === 'night')));

    const [morningResult, nightResult] = await Promise.allSettled(promises);

    const morning =
      morningResult.status === 'fulfilled' ? morningResult.value : null;
    const night = nightResult.status === 'fulfilled' ? nightResult.value : null;

    if (morningResult.status === 'rejected') {
      this.logger.error(
        `Morning ritual failed for program ${programId}`,
        morningResult.reason,
      );
    }
    if (nightResult.status === 'rejected') {
      this.logger.error(
        `Night ritual failed for program ${programId}`,
        nightResult.reason,
      );
    }

    return { morning, night };
  }

  async getActiveProgram(userId: string): Promise<Program | null> {
    return this.programRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async generateRitual(
    programId: string,
    type: 'morning' | 'night',
  ): Promise<RitualTrack> {
    // 1. Get current program to provide context
    const program = await this.programRepository.findOne({
      where: { id: programId },
    });

    if (!program) throw new Error('Program not found');
    const userId = program.userId;
    const theme = program.title || 'Personal Growth';
    const title =
      type === 'morning'
        ? `Morning Affirmations: ${theme}`
        : `Nightly Subliminals: ${theme}`;
    const audioFilename = `ritual_${type}_${programId}`;

    // Check if already completed (has a real URL)
    const existing = await this.ritualTrackRepository.findOne({
      where: { programId, ritualType: type },
    });
    if (existing && existing.url && existing.url.length > 0) return existing;

    try {
      // 1. Get user settings to check preference
      const user = await this.usersService.findById(userId);
      const sourcePreference = user.settings?.ritualSource || 'auto'; // Default to auto

      let publicUrl = '';
      let metadata: any = {};
      let usedSource: 'youtube' | 'ai' = 'ai';

      // ATTEMPT YOUTUBE if preference is 'auto' or 'youtube'
      if (sourcePreference === 'auto' || sourcePreference === 'youtube') {
        try {
          this.logger.log(
            `Attempting YouTube source for ${type} ritual: ${theme}`,
          );
          const ytVideo = await this.youtubeService.getBestRitualAudio(
            theme,
            type,
          );

          if (ytVideo) {
            const audioPath = await this.youtubeAudioService.extractAudio(
              ytVideo.videoId,
            );
            publicUrl = await this.audioService.uploadToCloudinary(
              audioPath,
              audioFilename,
            );

            metadata = {
              source: 'youtube',
              videoId: ytVideo.videoId,
              ytTitle: ytVideo.title,
              channel: ytVideo.channel,
              originUrl: ytVideo.url,
              relevanceScore: ytVideo.relevanceScore,
            };
            usedSource = 'youtube';
            this.youtubeAudioService.cleanup(audioPath);
          } else {
            this.logger.log(
              `No relevant YouTube video found for ${theme}. Falling back to AI.`,
            );
          }
        } catch (ytError) {
          this.logger.warn(
            `YouTube path failed for ${theme}, falling back to AI: ${ytError.message}`,
          );
        }
      }

      // FALLBACK TO AI if YouTube failed or preference is 'ai'
      if (usedSource === 'ai') {
        this.logger.log(`Generating AI ${type} ritual for ${theme}`);
        const scriptData = await this.aiService.generateAudioScript(
          theme,
          type === 'morning' ? 30 : 60,
          type,
        );
        metadata = { ...scriptData, source: 'ai' };

        const tempDir = path.join(os.tmpdir(), 'ease-rituals');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const audioPath =
          await this.audioMixerService.createBinauralSubliminalTrack(
            scriptData,
            tempDir,
            type === 'morning' ? 30 : 60,
          );

        publicUrl = await this.audioService.uploadToCloudinary(
          audioPath,
          audioFilename,
        );
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      }

      // 3. Save to DB — update the placeholder if it exists, otherwise create
      if (existing) {
        existing.title = title;
        existing.url = publicUrl;
        existing.duration = type === 'morning' ? 1800 : 3600;
        existing.metadata = metadata;
        return await this.ritualTrackRepository.save(existing);
      }

      const ritual = this.ritualTrackRepository.create({
        userId,
        programId,
        ritualType: type,
        title,
        url: publicUrl,
        duration: type === 'morning' ? 1800 : 3600,
        metadata,
      });

      return await this.ritualTrackRepository.save(ritual);
    } catch (error) {
      this.logger.error(
        `Failed to generate ${type} ritual for program ${programId}: ${error.message}`,
      );

      // Save failed state so UI knows not to spin forever
      if (existing) {
        existing.metadata = { 
          ...(typeof existing.metadata === 'object' ? existing.metadata : {}), 
          status: 'failed', 
          error: error.message 
        };
        await this.ritualTrackRepository.save(existing).catch(e => this.logger.error('Failed to save error state', e));
      } else {
        const failedRitual = this.ritualTrackRepository.create({
          userId,
          programId,
          ritualType: type,
          title,
          url: '',
          duration: 0,
          metadata: { status: 'failed', error: error.message },
        });
        await this.ritualTrackRepository.save(failedRitual).catch(e => this.logger.error('Failed to save error state', e));
      }

      throw error;
    }
  }

  async findByProgram(programId: string): Promise<RitualTrack[]> {
    return this.ritualTrackRepository.find({
      where: { programId },
    });
  }

  async regenerateRitualById(id: string): Promise<RitualTrack> {
    const ritual = await this.ritualTrackRepository.findOne({ where: { id } });
    if (!ritual) {
      throw new Error('Ritual not found');
    }

    this.logger.log(
      `Forced regeneration of ritual track: ${id} (${ritual.ritualType})`,
    );

    // Reset URL so generateRitual is forced to run AI/YouTube mixing pipeline
    ritual.url = '';
    await this.ritualTrackRepository.save(ritual);

    return this.generateRitual(
      ritual.programId,
      ritual.ritualType as 'morning' | 'night',
    );
  }
}
