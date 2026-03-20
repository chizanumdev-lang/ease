import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AudioTrack } from './entities/audio-track.entity';
import { AudioService } from './audio.service';
import { AiService } from '../ai/ai.service';
import { AudioMixerService } from './audio-mixer.service';

@Processor('audio-generation', {
    lockDuration: 600000, // 10 minutes (for TTS + mixing)
})
@Injectable()
export class AudioProcessor extends WorkerHost {
    private readonly logger = new Logger(AudioProcessor.name);

    constructor(
        @InjectRepository(AudioTrack)
        private audioTrackRepository: Repository<AudioTrack>,
        private audioService: AudioService,
        private aiService: AiService,
        private audioMixerService: AudioMixerService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        const { audioTrackId, theme, audioFilename } = job.data;
        this.logger.log(`Processing audio generation job ${job.id} for track ${audioTrackId}`);

        try {
            // 0. Check if already generated (sync path)
            const existingTrack = await this.audioTrackRepository.findOne({ where: { id: audioTrackId } });
            if (existingTrack && existingTrack.url && existingTrack.url !== 'generating...' && existingTrack.url !== '' && !existingTrack.url.includes('pixabay.com')) {
                this.logger.log(`Audio track ${audioTrackId} already generated, skipping job`);
                return { success: true, url: existingTrack.url };
            }

            // 1. Generate script with AI
            const scriptData = await this.aiService.generateAudioScript(theme, 5);

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
