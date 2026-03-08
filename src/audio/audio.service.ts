import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import ffmpeg = require('fluent-ffmpeg');
import { v2 as cloudinary } from 'cloudinary';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

@Injectable()
export class AudioService {
    private readonly logger = new Logger(AudioService.name);
    private readonly backgroundsDir = path.join(process.cwd(), 'assets/audio/backgrounds');
    private readonly tempDir = path.join(os.tmpdir(), 'ease-audio');
    private readonly elevenLabs: ElevenLabsClient;

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

        this.elevenLabs = new ElevenLabsClient({
            apiKey: this.configService.get<string>('ELEVENLABS_API_KEY'),
        });
    }

    async generateAudioTrack(script: string, mood: string, filename: string): Promise<string> {
        const voicePath = path.join(this.tempDir, `${filename}_voice.mp3`);
        const outputPath = path.join(this.tempDir, `${filename}.mp3`);
        const backgroundPath = path.join(this.backgroundsDir, `${mood}.mp3`);

        try {
            // 1. TTS using ElevenLabs
            this.logger.log(`Generating TTS with ElevenLabs for mood: ${mood}`);
            const audioStream = await this.elevenLabs.textToSpeech.convert(
                "21m00Tcm4TlvDq8ikWAM", // Rachel
                {
                    text: script,
                    modelId: "eleven_multilingual_v2",
                    outputFormat: "mp3_44100_128",
                }
            );

            // Write the Web ReadableStream to a temporary file
            const fileStream = fs.createWriteStream(voicePath);
            const reader = audioStream.getReader();

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    fileStream.write(value);
                }
            } finally {
                reader.releaseLock();
            }
            fileStream.end();

            // Wait for file to be fully written
            await new Promise((resolve, reject) => {
                fileStream.on('finish', () => resolve(undefined));
                fileStream.on('error', reject);
            });

            // 2. Mix narration with background music
            await this.mixAudio(voicePath, backgroundPath, outputPath);

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

    private async mixAudio(voicePath: string, backgroundPath: string, outputPath: string): Promise<void> {
        const bgExists = fs.existsSync(backgroundPath);
        this.logger.debug(`Mixing audio — background exists: ${bgExists}`);

        return new Promise((resolve, reject) => {
            let command = ffmpeg().input(voicePath);
            if (bgExists) {
                command = command.input(backgroundPath).inputOptions(['-stream_loop', '-1']);
            }

            const filters: any[] = [];
            if (bgExists) {
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
