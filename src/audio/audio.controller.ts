import { Controller, Post, Body, Logger } from '@nestjs/common';
import { AudioService } from './audio.service';
import { AiService } from '../ai/ai.service';

@Controller('audio')
export class AudioController {
    private readonly logger = new Logger(AudioController.name);

    constructor(
        private readonly audioService: AudioService,
        private readonly aiService: AiService,
    ) { }

    @Post('preview')
    async generatePreview(@Body() body: { theme: string; mood: string; goal?: string; dayNumber?: number }) {
        const { theme, mood, goal = 'General Improvement', dayNumber = 1 } = body;
        this.logger.log(`Generating preview for theme: ${theme}, mood: ${mood}`);

        // 1. Generate long 5-min script
        const script = await this.aiService.generateAudioScript(theme, mood, goal, dayNumber);

        // 2. Generate audio track
        const filename = `preview_${Date.now()}`;
        const audioUrl = await this.audioService.generateAudioTrack(script, mood, filename);

        return { url: audioUrl };
    }
}
