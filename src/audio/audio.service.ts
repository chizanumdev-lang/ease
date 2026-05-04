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
    private readonly BACKGROUND_URLS: Record<string, string> = {
        ambient: 'https://res.cloudinary.com/duooultxc/video/upload/v1773045822/ease/backgrounds/ambient.mp3',
        focus: 'https://res.cloudinary.com/duooultxc/video/upload/v1773045885/ease/backgrounds/focus.mp3',
        meditation: 'https://res.cloudinary.com/duooultxc/video/upload/v1773045929/ease/backgrounds/meditation.mp3',
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

    async generateAudioTrack(script: string, mood: string, filename: string): Promise<string> {
        this.logger.log(`[v1.0.7-VOLUME-ADJUSTED] Generating audio track for filename: ${filename}`);
        const voicePath = path.join(this.tempDir, `${filename}_voice.mp3`);
        const outputPath = path.join(this.tempDir, `${filename}.mp3`);

        try {
            // 1. TTS using Microsoft Edge TTS (Free, Neural)
            this.logger.log(`Generating TTS with Microsoft Edge TTS for mood: ${mood}`);

            // Instantiate a new TTS client per request
            const tts = new MsEdgeTTS();

            // VERCEL FIX: Manually ensure _metadataOptions is initialized to avoid TypeError
            // The library fails to initialize this in some environments (Vercel Node.js)
            (tts as any)._metadataOptions = {
                voiceLocale: 'en-US',
                sentenceBoundaryEnabled: false,
                wordBoundaryEnabled: false
            };

            const VOICE_BY_MOOD: Record<string, string> = {
                meditation: 'en-US-AriaNeural',      // softer, breathy — better for wind-down
                focus: 'en-US-AvaMultilingualNeural', // clear, confident — keep your current
                ambient: 'en-US-JennyNeural',     // warm, gentle — better for sleep prep
            };

            const voice = VOICE_BY_MOOD[mood] || 'en-US-AvaMultilingualNeural';

            // Set voice (Ava is high quality, multilingual)
            await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, { voiceLocale: 'en-US' });

            // Generate audio to file
            await new Promise((resolve, reject) => {
                const { audioStream } = tts.toStream(script);
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

            // 2. Mix narration with background music (RE-ENABLED per user request)
            await this.mixAudio(voicePath, mood, outputPath);

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
        files.forEach(file => {
            try {
                if (fs.existsSync(file)) fs.unlinkSync(file);
            } catch (err) {
                this.logger.warn(`Failed to cleanup file: ${file}`, err);
            }
        });
    }

    public async uploadToCloudinary(filePath: string, publicId: string): Promise<string> {
        const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
        
        if (!cloudName || cloudName.trim() === '') {
            this.logger.warn(`Cloudinary not configured. Skipping upload for ${publicId}. Using placeholder.`);
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
                });
                this.logger.log(`Cloudinary upload success: ${result.secure_url}`);
                return result.secure_url;
            } catch (error) {
                attempts++;
                this.logger.warn(`Cloudinary upload attempt ${attempts} failed: ${error.message}`);
                if (attempts >= maxAttempts) {
                    this.logger.error(`Cloudinary upload failed after ${maxAttempts} attempts for ${publicId}. Using placeholder.`);
                    return 'https://res.cloudinary.com/duooultxc/video/upload/v1773045822/ease/backgrounds/ambient.mp3';
                }
                // Wait 1s before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return 'https://res.cloudinary.com/duooultxc/video/upload/v1773045822/ease/backgrounds/ambient.mp3';
    }

    private async mixAudio(voicePath: string, mood: string, outputPath: string): Promise<void> {
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

        const localBackgroundPath = path.join(process.cwd(), 'assets/audio/backgrounds', `${mood}.mp3`);
        const backgroundUrl = this.BACKGROUND_URLS[mood];
        
        let bgSource = localBackgroundPath;
        let isTempBg = false;

        if (!fs.existsSync(localBackgroundPath) && backgroundUrl) {
            this.logger.log(`Local background not found for ${mood}, downloading from ${backgroundUrl}`);
            try {
                const tempBgPath = path.join(this.tempDir, `bg_${mood}_${Date.now()}.mp3`);
                const response = await axios({
                    url: backgroundUrl,
                    method: 'GET',
                    responseType: 'arraybuffer',
                    timeout: 10000,
                });
                fs.writeFileSync(tempBgPath, Buffer.from(response.data));
                bgSource = tempBgPath;
                isTempBg = true;
            } catch (err) {
                this.logger.warn(`Failed to download background for ${mood}, will try direct URL`, err);
                bgSource = backgroundUrl;
            }
        }

        this.logger.debug(`Mixing audio — voice path: ${voicePath}, background source: ${bgSource}`);
        
        return new Promise((resolve, reject) => {
            let command = ffmpeg().input(voicePath);
            if (bgSource) {
                command = command.input(bgSource).inputOptions(['-stream_loop', '-1']);
            }

            const filters: any[] = [];
            if (bgSource) {
                filters.push({ filter: 'volume', options: '0.4', inputs: '0:a', outputs: 'v' });
                filters.push({ filter: 'volume', options: '1.0', inputs: '1:a', outputs: 'b' });
                filters.push({ filter: 'amix', options: { inputs: 2, duration: 'first', dropout_transition: 3 }, inputs: ['v', 'b'], outputs: 'mixed' });
            } else {
                filters.push({ filter: 'volume', options: '1.0', inputs: '0:a', outputs: 'mixed' });
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
