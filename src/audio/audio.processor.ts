import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AudioTrack } from './entities/audio-track.entity';
import { AudioService } from './audio.service';
import { AiService } from '../ai/ai.service';

@Processor('audio-generation', {
    lockDuration: 120000, // 2 minutes (for FFmpeg mixing)
})
@Injectable()
export class AudioProcessor extends WorkerHost {
    private readonly logger = new Logger(AudioProcessor.name);

    constructor(
        @InjectRepository(AudioTrack)
        private audioTrackRepository: Repository<AudioTrack>,
        private audioService: AudioService,
        private aiService: AiService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        const { audioTrackId, theme, mood, audioFilename, goal, dayNumber } = job.data;
        this.logger.log(`Processing audio generation job ${job.id} for track ${audioTrackId}`);

        try {
            // 0. Check if already generated (sync path)
            const existingTrack = await this.audioTrackRepository.findOne({ where: { id: audioTrackId } });
            if (existingTrack && existingTrack.url && existingTrack.url !== 'generating...' && existingTrack.url !== '' && !existingTrack.url.includes('pixabay.com')) {
                this.logger.log(`Audio track ${audioTrackId} already generated, skipping job`);
                return { success: true, url: existingTrack.url };
            }

            // 1. Generate script
            const script = await this.aiService.generateAudioScript(theme, mood, goal || 'General Improvement', dayNumber || 1);
            
            // 2. Generate actual TTS audio
            const audioUrl = await this.audioService.generateAudioTrack(script, mood, audioFilename);
            
            // 3. Update DB record
            const track = await this.audioTrackRepository.findOne({ where: { id: audioTrackId } });
            if (track) {
                track.url = audioUrl;
                await this.audioTrackRepository.save(track);
                this.logger.log(`Successfully generated and saved audio track ${audioTrackId}`);
            } else {
                this.logger.warn(`AudioTrack ${audioTrackId} not found in DB after generation`);
            }
            
            return { success: true, url: audioUrl };
        } catch (error) {
            this.logger.error(`Failed to process audio generation job ${job.id}:`, error);
            // Re-throw to let BullMQ handle retries if configured
            throw error;
        }
    }
}
