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
  async claimGeneration(userId: string, date: string): Promise<boolean> {
    const existing = await this.ritualTrackRepository.findOne({
      where: { userId, date },
    });
    if (existing) return false; // Another instance already started

    try {
      // Insert placeholder records to claim the slot.
      // If two instances race, the unique constraint (userId+date+ritualType)
      // will cause one to fail — that's intentional.
      await this.ritualTrackRepository.save([
        this.ritualTrackRepository.create({
          userId,
          ritualType: 'morning',
          date,
          title: 'Generating...',
          url: '',
          duration: 300,
          metadata: { status: 'generating' },
        }),
        this.ritualTrackRepository.create({
          userId,
          ritualType: 'night',
          date,
          title: 'Generating...',
          url: '',
          duration: 600,
          metadata: { status: 'generating' },
        }),
      ]);
      this.logger.log(`Claimed generation slot for user ${userId} on ${date}`);
      return true;
    } catch (err) {
      // Unique constraint violation = another instance won the race
      this.logger.debug(
        `Generation slot already claimed for ${userId}/${date}: ${err.message}`,
      );
      return false;
    }
  }

  async generateDailyRituals(
    userId: string,
    date: string,
  ): Promise<{ morning: RitualTrack | null; night: RitualTrack | null }> {
    this.logger.log(`Syncing daily rituals for user ${userId} on date ${date}`);

    // Generate in parallel for the daily sync trigger
    const [morningResult, nightResult] = await Promise.allSettled([
      this.generateRitual(userId, 'morning', date),
      this.generateRitual(userId, 'night', date),
    ]);

    const morning =
      morningResult.status === 'fulfilled' ? morningResult.value : null;
    const night = nightResult.status === 'fulfilled' ? nightResult.value : null;

    if (morningResult.status === 'rejected') {
      this.logger.error(
        `Morning ritual failed for user ${userId}`,
        morningResult.reason,
      );
    }
    if (nightResult.status === 'rejected') {
      this.logger.error(
        `Night ritual failed for user ${userId}`,
        nightResult.reason,
      );
    }

    return { morning, night };
  }

  async generateRitual(
    userId: string,
    type: 'morning' | 'night',
    date: string,
  ): Promise<RitualTrack> {
    // 1. Get current program to provide context
    const program = await this.programRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const theme = program?.title || 'Personal Growth';
    const title =
      type === 'morning'
        ? `Morning Affirmations: ${theme}`
        : `Nightly Subliminals: ${theme}`;
    const audioFilename = `ritual_${type}_${userId}_${date.replace(/-/g, '_')}`;

    // Check if already completed (has a real URL)
    const existing = await this.ritualTrackRepository.findOne({
      where: { userId, ritualType: type, date },
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
          type === 'morning' ? 5 : 10,
          type,
        );
        metadata = { ...scriptData, source: 'ai' };

        const tempDir = path.join(os.tmpdir(), 'ease-rituals');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const audioPath =
          await this.audioMixerService.createBinauralSubliminalTrack(
            scriptData,
            tempDir,
            type === 'morning' ? 5 : 10,
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
        existing.metadata = metadata;
        return await this.ritualTrackRepository.save(existing);
      }

      const ritual = this.ritualTrackRepository.create({
        userId,
        ritualType: type,
        date,
        title,
        url: publicUrl,
        duration: type === 'morning' ? 300 : 600,
        metadata,
      });

      return await this.ritualTrackRepository.save(ritual);
    } catch (error) {
      this.logger.error(
        `Failed to generate ${type} ritual for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  async findByDate(userId: string, date: string): Promise<RitualTrack[]> {
    return this.ritualTrackRepository.find({
      where: { userId, date },
    });
  }

  async regenerateRitualById(id: string): Promise<RitualTrack> {
    const ritual = await this.ritualTrackRepository.findOne({ where: { id } });
    if (!ritual) {
      throw new Error('Ritual not found');
    }

    this.logger.log(
      `Forced regeneration of ritual track: ${id} (${ritual.ritualType} / ${ritual.date})`,
    );

    // Reset URL so generateRitual is forced to run AI/YouTube mixing pipeline
    ritual.url = '';
    await this.ritualTrackRepository.save(ritual);

    return this.generateRitual(
      ritual.userId,
      ritual.ritualType as 'morning' | 'night',
      ritual.date,
    );
  }
}
