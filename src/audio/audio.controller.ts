import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Request,
  UseGuards,
  Logger,
} from '@nestjs/common';
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
  ) {}

  @Post('preview')
  async generatePreview(
    @Body()
    body: {
      theme: string;
      mood: string;
      goal?: string;
      dayNumber?: number;
    },
  ) {
    const { theme, mood, goal = 'General Improvement', dayNumber = 1 } = body;
    this.logger.log(
      `Generating [BINAURAL] preview for theme: ${theme}, mood: ${mood}`,
    );

    // 1. Generate script (using AI or standard template)
    // For preview, we generate a shorter 1-min script to save time/cost
    const scriptData = await this.aiService.generateAudioScript(theme, 3);

    // Ensure we have binaural params
    const finalScriptData = {
      ...scriptData,
      binauralFrequency: 10, // Alpha wave for preview
      carrierFrequency: 200,
      theme,
    };

    // 2. Generate binaural + subliminal audio track using AudioMixerService
    const filename = `preview_${Date.now()}`;
    const outputDir = os.tmpdir();
    const localPath =
      await this.audioMixerService.createBinauralSubliminalTrack(
        finalScriptData,
        outputDir,
        1, // 1 minute duration for preview
      );

    // 3. Upload to Cloudinary using existing AudioService method
    const audioUrl = await this.audioService.uploadToCloudinary(
      localPath,
      filename,
    );

    return { url: audioUrl };
  }

  @Post('preview-binaural')
  async generateBinauralPreview(@Body() body: { frequency: number }) {
    const { frequency = 10 } = body;
    this.logger.log(
      `Generating RAW BINAURAL preview for frequency: ${frequency}Hz`,
    );

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
    const audioUrl = await this.audioService.uploadToCloudinary(
      tempPath,
      filename,
    );

    // 4. Cleanup
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    return { url: audioUrl };
  }
  @Get('rituals/active')
  @UseGuards(JwtAuthGuard)
  async getActiveProgramRituals(@Request() req) {
    const userId = req.user.id;
    
    // Find active program
    const program = await this.ritualsService.getActiveProgram(userId);
    if (!program) {
      return { morning: null, night: null, status: 'none' };
    }

    const rituals = await this.ritualsService.findByProgram(program.id);

    if (rituals.length < 2) {
      // In the new architecture, the background orchestrator triggers the rituals.
      // But just in case, we can trigger them here if they are missing.
      const claimed = await this.ritualsService.claimGeneration(program.id);
      if (claimed) {
        this.ritualsService
          .generateProgramRituals(program.id)
          .catch((err) =>
            this.logger.error(`Lazy ritual generation failed: ${err.message}`),
          );
      }
      return {
        morning: rituals.find((r) => r.ritualType === 'morning') || null,
        night: rituals.find((r) => r.ritualType === 'night') || null,
        status: 'generating',
      };
    }

    // Check if any ritual is still generating (placeholder URL)
    const allReady = rituals.every((r) => r.url && r.url.length > 0);

    return {
      morning: rituals.find((r) => r.ritualType === 'morning') || null,
      night: rituals.find((r) => r.ritualType === 'night') || null,
      status: allReady ? 'ready' : 'generating',
    };
  }

  @Post('test-immersive')
  @UseGuards(JwtAuthGuard)
  async generateFullTest(@Body() body: { goal: string }) {
    const { goal } = body;
    this.logger.log(`Generating FULL IMMERSIVE TEST for goal: ${goal}`);

    // We'll generate all 3 in parallel to save time
    const results = await Promise.all([
      this.generateSingleTestTrack(goal, 'morning', 1),
      this.generateSingleTestTrack(goal, 'night', 1),
      this.generateSingleTestTrack(goal, 'task', 1),
    ]);

    return {
      morningUrl: results[0],
      nightUrl: results[1],
      taskUrl: results[2],
    };
  }

  @Post('rituals/:id/regenerate')
  @UseGuards(JwtAuthGuard)
  async regenerateRitual(@Param('id') id: string) {
    this.logger.log(`Received request to regenerate ritual track: ${id}`);
    return this.ritualsService.regenerateRitualById(id);
  }

  private async generateSingleTestTrack(
    goal: string,
    type: 'morning' | 'night' | 'task',
    duration: number,
  ): Promise<string> {
    try {
      const scriptData = await this.aiService.generateAudioScript(
        goal,
        duration,
        type,
      );
      const filename = `test_${type}_${Date.now()}`;
      const outputDir = path.join(os.tmpdir(), 'ease-test');
      if (!require('fs').existsSync(outputDir))
        require('fs').mkdirSync(outputDir, { recursive: true });

      const localPath =
        await this.audioMixerService.createBinauralSubliminalTrack(
          scriptData,
          outputDir,
          duration,
        );

      const audioUrl = await this.audioService.uploadToCloudinary(
        localPath,
        filename,
      );

      // Cleanup
      if (require('fs').existsSync(localPath))
        require('fs').unlinkSync(localPath);

      return audioUrl;
    } catch (error) {
      this.logger.error(
        `Failed to generate test track for ${type}: ${error.message}`,
      );
      return ''; // Return empty so the frontend knows this one failed
    }
  }
}
