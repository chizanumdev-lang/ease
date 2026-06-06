import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import ffmpeg = require('fluent-ffmpeg');
import { v2 as cloudinary } from 'cloudinary';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import axios from 'axios';

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);
  private readonly tempDir = path.join(os.tmpdir(), 'ease-audio');
  // Cache downloaded background files so they are only fetched once per PM2 process
  private readonly bgCache = new Map<string, string>();
  private readonly BACKGROUND_URLS: Record<string, string> = {
    ambient:
      'https://res.cloudinary.com/duooultxc/video/upload/v1773045822/ease/backgrounds/ambient.mp3',
    focus:
      'https://res.cloudinary.com/duooultxc/video/upload/v1773045885/ease/backgrounds/focus.mp3',
    meditation:
      'https://res.cloudinary.com/duooultxc/video/upload/v1773045929/ease/backgrounds/meditation.mp3',
  };

  constructor(private configService: ConfigService) {
    // Ensure temp directory exists (writable in Vercel)
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async generateAudioTrack(
    script: string,
    mood: string,
    filename: string,
    skipBackground: boolean = false,
    speed: string = '0%',
  ): Promise<string> {
    this.logger.log(
      `[v1.0.8] Generating audio track (speed: ${speed}, skip: ${skipBackground}) for: ${filename}`,
    );

    // Safety: Prevent empty script generation
    const cleanScript = (script || '').trim();
    if (!cleanScript) {
      this.logger.warn(
        `Empty script provided for ${filename}. Using safety fallback.`,
      );
      script = 'Please focus and listen carefully to the following exercise.';
    }

    const voicePath = path.join(this.tempDir, `${filename}_voice.mp3`);
    const outputPath = path.join(this.tempDir, `${filename}.mp3`);

    try {
      // 1. TTS using Microsoft Edge TTS
      const tts = new MsEdgeTTS();

      const VOICE_BY_MOOD: Record<string, string> = {
        meditation: 'en-US-AriaNeural',
        focus: 'en-US-AvaMultilingualNeural',
        ambient: 'en-US-JennyNeural',
        french: 'fr-FR-DeniseNeural',
      };

      const voice = VOICE_BY_MOOD[mood] || 'en-US-AvaMultilingualNeural';
      const locale = mood === 'french' ? 'fr-FR' : 'en-US';

      (tts as any)._metadataOptions = {
        voiceLocale: locale,
        sentenceBoundaryEnabled: false,
        wordBoundaryEnabled: false,
      };
      await tts.setMetadata(
        voice,
        OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
        { voiceLocale: locale },
      );

      await new Promise((resolve, reject) => {
        // Apply speed/rate to the stream
        const { audioStream } = tts.toStream(script, { rate: speed });
        const fileStream = fs.createWriteStream(voicePath);
        audioStream.on('data', (chunk) => fileStream.write(chunk));
        audioStream.on('end', () => {
          fileStream.end();
          resolve(undefined);
        });
        audioStream.on('error', (err) => {
          fileStream.end();
          reject(err);
        });
      });

      // 2. Conditional Mixing: Skip background for clear model audio (e.g. Vocal Tests)
      if (skipBackground) {
        this.logger.log(
          `Skipping background music for clean output: ${filename}`,
        );
        fs.renameSync(voicePath, outputPath);
      } else {
        await this.mixAudio(voicePath, mood, outputPath);
      }

      // 3. Upload to Cloudinary
      const cloudinaryUrl = await this.uploadToCloudinary(outputPath, filename);

      // 4. Cleanup
      this.cleanup([voicePath, outputPath]);

      return cloudinaryUrl;
    } catch (error) {
      this.logger.error('Failed to generate audio track', error);
      this.cleanup([voicePath, outputPath]);
      throw error;
    }
  }

  private cleanup(files: string[]) {
    files.forEach((file) => {
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch (err) {
        this.logger.warn(`Failed to cleanup file: ${file}`, err);
      }
    });
  }

  public async uploadToCloudinary(
    filePath: string,
    publicId: string,
  ): Promise<string> {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');

    if (!cloudName || cloudName.trim() === '') {
      this.logger.warn(
        `Cloudinary not configured. Skipping upload for ${publicId}. Using placeholder.`,
      );
      return 'https://res.cloudinary.com/duooultxc/video/upload/v1773045822/ease/backgrounds/ambient.mp3';
    }

    // Guard: ensure the file actually exists before attempting upload.
    // Missing file causes an opaque ENOENT deep inside the Cloudinary SDK.
    if (!fs.existsSync(filePath)) {
      this.logger.error(
        `uploadToCloudinary: file does not exist at ${filePath} — skipping upload for ${publicId}. ` +
        `This usually means FFmpeg failed to produce output (check FFmpeg logs above).`,
      );
      return 'https://res.cloudinary.com/duooultxc/video/upload/v1773045822/ease/backgrounds/ambient.mp3';
    }

    this.logger.log(`Uploading audio to Cloudinary: ${publicId}`);

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const result = await cloudinary.uploader.upload(filePath, {
          resource_type: 'video',
          public_id: `ease/audio/${publicId}`,
          overwrite: true,
          format: 'mp3',
          timeout: 600000, // 10 minutes timeout
        });
        this.logger.log(`Cloudinary upload success: ${result.secure_url}`);
        return result.secure_url;
      } catch (error) {
        attempts++;
        this.logger.warn(
          `Cloudinary upload attempt ${attempts} failed: ${(error as Error).message}`,
        );
        if (attempts >= maxAttempts) {
          this.logger.error(
            `Cloudinary upload failed after ${maxAttempts} attempts for ${publicId}. Using placeholder.`,
          );
          return 'https://res.cloudinary.com/duooultxc/video/upload/v1773045822/ease/backgrounds/ambient.mp3';
        }
        // Exponential backoff: 1s, 2s
        await new Promise((resolve) => setTimeout(resolve, attempts * 1000));
      }
    }
    return 'https://res.cloudinary.com/duooultxc/video/upload/v1773045822/ease/backgrounds/ambient.mp3';
  }

  public async deleteFromCloudinary(url: string): Promise<boolean> {
    if (!url || url.trim() === '') return false;
    
    try {
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
      if (!match || !match[1]) {
        this.logger.warn(`Could not extract public ID from Cloudinary URL: ${url}`);
        return false;
      }
      
      const publicId = match[1];
      this.logger.log(`Deleting from Cloudinary: ${publicId}`);
      
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      if (result.result !== 'ok' && result.result !== 'not found') {
        this.logger.warn(`Cloudinary deletion returned non-ok result for ${publicId}: ${result.result}`);
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete from Cloudinary (${url}): ${(error as Error).message}`);
      return false;
    }
  }

  private async mixAudio(
    voicePath: string,
    mood: string,
    outputPath: string,
  ): Promise<void> {
    // Lazy load binaries to avoid startup crashes if they are missing/blocked
    try {
      const ffmpegPath = require('ffmpeg-static');
      const ffprobePath = require('ffprobe-static').path;
      if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
      if (ffprobePath) ffmpeg.setFfprobePath(ffprobePath);
      this.logger.debug(`FFmpeg/FFprobe lazy loaded. FFmpeg: ${ffmpegPath}`);
    } catch (err) {
      this.logger.error('Lazy loading FFmpeg binaries failed', err);
    }

    const localBackgroundPath = path.join(
      process.cwd(),
      'assets/audio/backgrounds',
      `${mood}.mp3`,
    );
    const backgroundUrl = this.BACKGROUND_URLS[mood];

    let bgSource = localBackgroundPath;
    let isTempBg = false;

    if (!fs.existsSync(localBackgroundPath) && backgroundUrl) {
      // Check in-memory cache first — avoid re-downloading on every audio task
      const cached = this.bgCache.get(mood);
      if (cached && fs.existsSync(cached)) {
        this.logger.log(`Using cached background for ${mood}: ${cached}`);
        bgSource = cached;
      } else {
        this.logger.log(
          `Local background not found for ${mood}, downloading from ${backgroundUrl}`,
        );
        try {
          // Persist to a stable path so subsequent tasks in the same process reuse it
          const tempBgPath = path.join(this.tempDir, `bg_${mood}.mp3`);
          const response = await axios({
            url: backgroundUrl,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 15000,
          });
          fs.writeFileSync(tempBgPath, Buffer.from(response.data));
          this.bgCache.set(mood, tempBgPath);
          bgSource = tempBgPath;
          isTempBg = false; // Don't delete — we're caching it for reuse
        } catch (err) {
          this.logger.warn(
            `Failed to download background for ${mood}, will use direct URL`,
            err,
          );
          bgSource = backgroundUrl;
        }
      }
    }

    this.logger.debug(
      `Mixing audio — voice path: ${voicePath}, background source: ${bgSource}`,
    );

    return new Promise((resolve, reject) => {
      let command = ffmpeg().input(voicePath);
      if (bgSource) {
        command = command.input(bgSource).inputOptions(['-stream_loop', '-1']);
      }

      const filters: any[] = [];
      if (bgSource) {
        filters.push({
          filter: 'volume',
          options: '1.2',
          inputs: '0:a',
          outputs: 'v',
        });
        filters.push({
          filter: 'volume',
          options: '0.2',
          inputs: '1:a',
          outputs: 'b',
        });
        filters.push({
          filter: 'amix',
          options: { inputs: 2, duration: 'first', dropout_transition: 3 },
          inputs: ['v', 'b'],
          outputs: 'mixed',
        });
      } else {
        filters.push({
          filter: 'volume',
          options: '1.0',
          inputs: '0:a',
          outputs: 'mixed',
        });
      }

      command
        .complexFilter(filters, 'mixed')
        .audioCodec('libmp3lame')
        .audioBitrate('64k')
        .on('start', (cmd) => this.logger.debug(`FFmpeg: ${cmd}`))
        .on('error', (err, _stdout, stderr) => {
          this.logger.error(`FFmpeg error: ${err.message} — ${stderr}`);
          if (isTempBg) fs.unlinkSync(bgSource);
          reject(err);
        })
        .on('end', () => {
          this.logger.log(`Audio mixed: ${outputPath}`);
          if (isTempBg) fs.unlinkSync(bgSource);
          resolve();
        })
        .save(outputPath);
    });
  }
}
