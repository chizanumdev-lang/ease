import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { AudioTrack } from './entities/audio-track.entity';
import { AudioService } from './audio.service';
import { AiService } from '../ai/ai.service';
import { AudioMixerService } from './audio-mixer.service';

@Processor('audio-generation', {
    lockDuration: 600000, // 10 minutes (for TTS + mixing)
})
@Injectable()
export class AudioProcessor extends WorkerHost implements OnModuleInit {
    private readonly logger = new Logger(AudioProcessor.name);
    private readonly isVercel = !!process.env.VERCEL;

    constructor(
        @InjectRepository(AudioTrack)
        private audioTrackRepository: Repository<AudioTrack>,
        @InjectQueue('audio-generation')
        private audioQueue: Queue,
        private audioService: AudioService,
        private aiService: AiService,
        private audioMixerService: AudioMixerService,
    ) {
        super();
    }

    /**
     * On startup, find any AudioTracks still stuck on a static_binaural placeholder
     * (their generation job ran before the skip-condition bug was fixed and returned early).
     * Re-queue them so they get properly generated.
     */
    async onModuleInit() {
        if (this.isVercel) {
            this.logger.debug('Skipping AudioProcessor init on Vercel serverless');
            return;
        }
        try {
            const stuckTracks = await this.audioTrackRepository.find({
                where: [
                    { url: Like('%static_binaural%') },
                ],
            });

            if (stuckTracks.length === 0) return;

            this.logger.log(`Found ${stuckTracks.length} stuck audio track(s) — re-queuing generation`);

            for (const track of stuckTracks) {
                // Derive theme from dayPlan via metadata if available, otherwise use a sensible default
                const theme = track.metadata?.theme || track.type || 'Personal Growth';
                await this.audioQueue.add(
                    'generate-audio',
                    { audioTrackId: track.id, theme, audioFilename: `program_track_${track.id}` },
                    { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
                );
                this.logger.log(`Re-queued audio generation for track ${track.id} (theme: ${theme})`);
            }
        } catch (err) {
            this.logger.warn(`Failed to re-queue stuck audio tracks: ${err?.message}`);
        }
    }

    async process(job: Job<any, any, string>): Promise<any> {
        if (this.isVercel) {
            this.logger.warn(`Skipping audio job ${job.id} on Vercel serverless — needs dedicated worker`);
            return { success: false, reason: 'serverless_skip' };
        }
        const { audioTrackId, theme, audioFilename } = job.data;
        this.logger.log(`Processing audio generation job ${job.id} for track ${audioTrackId}`);

        try {
            // 0. Check if already generated (sync path).
            // NOTE: static_binaural URLs are placeholders set at hydration time — they are NOT
            // a finished mixed track. Only skip if the URL is a real Cloudinary-uploaded result.
            const existingTrack = await this.audioTrackRepository.findOne({ where: { id: audioTrackId } });
            if (
                existingTrack &&
                existingTrack.url &&
                existingTrack.url !== 'generating...' &&
                existingTrack.url !== '' &&
                !existingTrack.url.includes('pixabay.com') &&
                !existingTrack.url.includes('static_binaural')
            ) {
                this.logger.log(`Audio track ${audioTrackId} already generated, skipping job`);
                return { success: true, url: existingTrack.url };
            }

            // 1. Generate script with AI
            const scriptData = await this.aiService.generateAudioScript(theme, 5, 'task');

            // 2. Create mixed audio file via AudioMixerService
            const tempDir = path.join(os.tmpdir(), 'ease-audio-binaural');
            const audioPath = await this.audioMixerService.createBinauralSubliminalTrack(
                scriptData,
                tempDir
            );

            // 3. Upload to storage (Cloudinary)
            const publicUrl = await this.audioService.uploadToCloudinary(audioPath, audioFilename);

            // 4. Update DB record
            const track = await this.audioTrackRepository.findOne({ where: { id: audioTrackId } });
            if (track) {
                track.url = publicUrl;
                track.type = scriptData.sessionType;
                track.metadata = {
                    sessionType: scriptData.sessionType,
                    frequency: scriptData.binauralFrequency,
                    affirmations: scriptData.affirmations,
                };
                await this.audioTrackRepository.save(track);
                this.logger.log(`Successfully generated and saved binaural track ${audioTrackId}`);
            } else {
                this.logger.warn(`AudioTrack ${audioTrackId} not found in DB after generation`);
            }

            // 5. Cleanup
            try {
                if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
            } catch (err) {
                this.logger.warn(`Failed to cleanup temp file: ${audioPath}`, err);
            }
            
            return { success: true, url: publicUrl };
        } catch (error) {
            this.logger.error(`Failed to process audio generation job ${job.id}:`, error);
            throw error;
        }
    }
}
