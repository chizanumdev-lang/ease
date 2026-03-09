import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import ffmpeg = require('fluent-ffmpeg');
import { v2 as cloudinary } from 'cloudinary';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

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

        try {
            const ffmpegPath = require('ffmpeg-static');
            if (ffmpegPath) {
                this.logger.log(`FFmpeg path resolved: ${ffmpegPath}`);
                ffmpeg.setFfmpegPath(ffmpegPath);
                // Also set an environment variable just in case fluent-ffmpeg checks it
                process.env.FFMPEG_PATH = ffmpegPath;
            } else {
                this.logger.error('ffmpeg-static returned an empty path');
            }
        } catch (err) {
            this.logger.error('Failed to require ffmpeg-static', err);
        }

        cloudinary.config({
            cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
        });
    }

    async generateAudioTrack(script: string, mood: string, filename: string): Promise<string> {
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

            // Set voice (Ava is high quality, multilingual)
            await tts.setMetadata('en-US-AvaMultilingualNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, { voiceLocale: 'en-US' });

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

            // 2. Mix narration with background music
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

    private async uploadToCloudinary(filePath: string, publicId: string): Promise<string> {
        this.logger.log(`Uploading audio to Cloudinary: ${publicId}`);
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: 'video',
            public_id: `ease/audio/${publicId}`,
            overwrite: true,
            format: 'mp3',
        });
        this.logger.log(`Cloudinary upload success: ${result.secure_url}`);
        return result.secure_url;
    }

    private async mixAudio(voicePath: string, mood: string, outputPath: string): Promise<void> {
        const localBackgroundPath = path.join(process.cwd(), 'assets/audio/backgrounds', `${mood}.mp3`);
        const backgroundUrl = this.BACKGROUND_URLS[mood];
        const bgSource = fs.existsSync(localBackgroundPath) ? localBackgroundPath : backgroundUrl;

        this.logger.debug(`Mixing audio — voice path: ${voicePath}, background source: ${bgSource}`);
        this.logger.debug(`Effective FFmpeg Path: ${process.env.FFMPEG_PATH || 'NOT SET'}`);

        return new Promise((resolve, reject) => {
            let command = ffmpeg().input(voicePath);
            if (bgSource) {
                command = command.input(bgSource).inputOptions(['-stream_loop', '-1']);
            }

            const filters: any[] = [];
            if (bgSource) {
                filters.push({ filter: 'volume', options: '1.0', inputs: '0:a', outputs: 'v' });
                filters.push({ filter: 'volume', options: '0.2', inputs: '1:a', outputs: 'b' });
                filters.push({ filter: 'amix', options: { inputs: 2, duration: 'first', dropout_transition: 3 }, inputs: ['v', 'b'], outputs: 'mixed' });
            } else {
                filters.push({ filter: 'volume', options: '1.0', inputs: '0:a', outputs: 'mixed' });
            }

            command
                .complexFilter(filters, 'mixed')
                .audioCodec('libmp3lame')
                .audioBitrate('128k')
                .on('start', (cmd) => this.logger.debug(`FFmpeg: ${cmd}`))
                .on('error', (err, _stdout, stderr) => {
                    this.logger.error(`FFmpeg error: ${err.message} — ${stderr}`);
                    reject(err);
                })
                .on('end', () => {
                    this.logger.log(`Audio mixed: ${outputPath}`);
                    resolve();
                })
                .save(outputPath);
        });
    }
}
