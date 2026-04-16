import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RitualTrack } from './entities/ritual-track.entity';
import { AiService } from '../ai/ai.service';
import { AudioService } from './audio.service';
import { AudioMixerService } from './audio-mixer.service';
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
    ) {}

    async generateDailyRituals(userId: string, date: string): Promise<{ morning: RitualTrack; night: RitualTrack }> {
        this.logger.log(`Generating daily rituals for user ${userId} on date ${date}`);

        // 1. Get current program to provide context
        const program = await this.programRepository.findOne({
            where: { userId },
            order: { createdAt: 'DESC' },
        });

        const contextTopic = program?.title || 'Personal Growth';
        
        // 2. Generate Morning Affirmations
        const morningTrack = await this.generateRitual(userId, 'morning', contextTopic, date);
        
        // 3. Generate Nightly Subliminals
        const nightTrack = await this.generateRitual(userId, 'night', contextTopic, date);

        return { morning: morningTrack, night: nightTrack };
    }

    private async generateRitual(
        userId: string,
        type: 'morning' | 'night',
        theme: string,
        date: string
    ): Promise<RitualTrack> {
        const title = type === 'morning' ? `Morning Affirmations: ${theme}` : `Nightly Subliminals: ${theme}`;
        const audioFilename = `ritual_${type}_${userId}_${date.replace(/-/g, '_')}`;

        // Check if already exists
        const existing = await this.ritualTrackRepository.findOne({
            where: { userId, ritualType: type, date }
        });
        if (existing) return existing;

        try {
            // 1. Generate script
            const scriptData = await this.aiService.generateAudioScript(theme, type === 'morning' ? 5 : 10);
            
            // 2. Create audio track
            const tempDir = path.join(os.tmpdir(), 'ease-rituals');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            
            const audioPath = await this.audioMixerService.createBinauralSubliminalTrack(
                scriptData,
                tempDir,
                type === 'morning' ? 5 : 10
            );

            // 3. Upload to Cloudinary
            const publicUrl = await this.audioService.uploadToCloudinary(audioPath, audioFilename);

            // 4. Save to DB
            const ritual = this.ritualTrackRepository.create({
                userId,
                ritualType: type,
                date,
                title,
                url: publicUrl,
                duration: type === 'morning' ? 300 : 600,
                metadata: scriptData
            });

            const saved = await this.ritualTrackRepository.save(ritual);

            // Cleanup
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

            return saved;
        } catch (error) {
            this.logger.error(`Failed to generate ${type} ritual for user ${userId}:`, error);
            throw error;
        }
    }

    async findByDate(userId: string, date: string): Promise<RitualTrack[]> {
        return this.ritualTrackRepository.find({
            where: { userId, date }
        });
    }
}
