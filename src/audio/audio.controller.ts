import { Controller, Post, Body, Get, Param, Request, UseGuards, Logger } from '@nestjs/common';
import { AudioService } from './audio.service';
import { AiService } from '../ai/ai.service';
import { AudioMixerService } from './audio-mixer.service';
import { RitualsService } from './rituals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as os from 'os';
import * as path from 'path';

@Controller('audio')
export class AudioController {
    private readonly logger = new Logger(AudioController.name);

    constructor(
        private readonly audioService: AudioService,
        private readonly aiService: AiService,
        private readonly audioMixerService: AudioMixerService,
        private readonly ritualsService: RitualsService,
    ) { }

    @Post('preview')
    async generatePreview(@Body() body: { theme: string; mood: string; goal?: string; dayNumber?: number }) {
        const { theme, mood, goal = 'General Improvement', dayNumber = 1 } = body;
        this.logger.log(`Generating [BINAURAL] preview for theme: ${theme}, mood: ${mood}`);

        // 1. Generate script (using AI or standard template)
        // For preview, we generate a shorter 1-min script to save time/cost
        const scriptData = await this.aiService.generateAudioScript(theme, 3);
        
        // Ensure we have binaural params
        const finalScriptData = {
            ...scriptData,
            binauralFrequency: 10, // Alpha wave for preview
            carrierFrequency: 200,
            theme
        };

        // 2. Generate binaural + subliminal audio track using AudioMixerService
        const filename = `preview_${Date.now()}`;
        const outputDir = os.tmpdir();
        const localPath = await this.audioMixerService.createBinauralSubliminalTrack(
            finalScriptData,
            outputDir,
            1 // 1 minute duration for preview
        );

        // 3. Upload to Cloudinary using existing AudioService method
        const audioUrl = await this.audioService.uploadToCloudinary(localPath, filename);

        return { url: audioUrl };
    }

    @Post('preview-binaural')
    async generateBinauralPreview(@Body() body: { frequency: number }) {
        const { frequency = 10 } = body;
        this.logger.log(`Generating RAW BINAURAL preview for frequency: ${frequency}Hz`);

        const filename = `binaural_${frequency}hz_${Date.now()}`;
        const tempPath = path.join(os.tmpdir(), `${filename}.wav`);

        // 1. Generate binaural beat
        const buffer = await this.audioMixerService.generateBinauralBeat({
            frequency,
            carrierFreq: 200,
            duration: 30, // 30 seconds for test
            fadeIn: 2,
            fadeOut: 2,
        });

        // 2. Save to file
        const fs = require('fs');
        fs.writeFileSync(tempPath, buffer);

        // 3. Upload to Cloudinary
        const audioUrl = await this.audioService.uploadToCloudinary(tempPath, filename);

        // 4. Cleanup
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

        return { url: audioUrl };
    }
    @Get('rituals/:date')
    @UseGuards(JwtAuthGuard)
    async getRituals(@Param('date') date: string, @Request() req) {
        const userId = req.user.id;
        const rituals = await this.ritualsService.findByDate(userId, date);

        if (rituals.length === 0) {
            // Background generation if missing
            this.ritualsService.generateDailyRituals(userId, date).catch(err => 
                this.logger.error(`Lazy ritual generation failed: ${err.message}`)
            );
            return {
                morning: null,
                night: null,
                status: 'generating'
            };
        }

        return {
            morning: rituals.find(r => r.ritualType === 'morning'),
            night: rituals.find(r => r.ritualType === 'night'),
            status: 'ready'
        };
    }
}
