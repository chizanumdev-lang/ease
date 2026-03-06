import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import ffmpeg = require('fluent-ffmpeg');
import { v2 as cloudinary } from 'cloudinary';

const execAsync = promisify(exec);

@Injectable()
export class AudioService {
    private readonly logger = new Logger(AudioService.name);
    private readonly backgroundsDir = path.join(process.cwd(), 'assets/audio/backgrounds');
    private readonly publicAudioDir = path.join(process.cwd(), 'public/audio');
    private readonly publicBackgroundsDir = path.join(process.cwd(), 'public/audio/backgrounds');
    private readonly tempDir = path.join(process.cwd(), 'temp/audio');

    constructor(private configService: ConfigService) {
        [this.backgroundsDir, this.publicAudioDir, this.tempDir, this.publicBackgroundsDir].forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        cloudinary.config({
            cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
        });

        this.syncBackgroundFiles();
    }

    private syncBackgroundFiles() {
        try {
            if (fs.existsSync(this.backgroundsDir)) {
                const files = fs.readdirSync(this.backgroundsDir);
                files.forEach(file => {
                    const src = path.join(this.backgroundsDir, file);
                    const dest = path.join(this.publicBackgroundsDir, file);
                    if (fs.statSync(src).isFile()) fs.copyFileSync(src, dest);
                });
                this.logger.log(`Synced ${files.length} background audio files to public directory`);
            }
        } catch (error) {
            this.logger.error('Failed to sync background files', error);
        }
    }

    async generateAudioTrack(script: string, mood: string, filename: string): Promise<string> {
        const voicePath = path.join(this.tempDir, `${filename}_voice.aiff`);
        const outputPath = path.join(this.tempDir, `${filename}.mp3`);
        const backgroundPath = path.join(this.backgroundsDir, `${mood}.mp3`);

        try {
            // 1. TTS using Mac 'say' (Shelley — calm, professional)
            this.logger.log(`Generating TTS for mood: ${mood}`);
            const scriptPath = path.join(this.tempDir, `${filename}_script.txt`);
            fs.writeFileSync(scriptPath, script);
            await execAsync(`say -v "Shelley (English (US))" -r 135 -f ${scriptPath} -o ${voicePath}`);
            if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);

            // 2. Mix narration with background music
            await this.mixAudio(voicePath, backgroundPath, outputPath);

            // 3. Cleanup voice file
            if (fs.existsSync(voicePath)) fs.unlinkSync(voicePath);

            // 4. Upload to Cloudinary
            const cloudinaryUrl = await this.uploadToCloudinary(outputPath, filename);

            // 5. Cleanup local output after upload
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

            return cloudinaryUrl;
        } catch (error) {
            this.logger.error('Failed to generate audio track', error);
            if (fs.existsSync(voicePath)) fs.unlinkSync(voicePath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            throw error;
        }
    }

    private async uploadToCloudinary(filePath: string, publicId: string): Promise<string> {
        try {
            this.logger.log(`Uploading audio to Cloudinary: ${publicId}`);
            const result = await cloudinary.uploader.upload(filePath, {
                resource_type: 'video',
                public_id: `ease/audio/${publicId}`,
                overwrite: true,
                format: 'mp3',
            });
            this.logger.log(`Cloudinary upload success: ${result.secure_url}`);
            return result.secure_url;
        } catch (error) {
            this.logger.error('Cloudinary upload failed, falling back to local URL', error);
            const localOutputPath = path.join(this.publicAudioDir, `${publicId}.mp3`);
            fs.copyFileSync(filePath, localOutputPath);
            const baseUrl = this.configService.get<string>('API_BASE_URL') || 'http://localhost:3000';
            return `${baseUrl.replace(/\/api$/, '')}/audio/${publicId}.mp3`;
        }
    }

    private async mixAudio(voicePath: string, backgroundPath: string, outputPath: string): Promise<void> {
        const bgExists = fs.existsSync(backgroundPath);
        this.logger.debug(`Mixing audio — background exists: ${bgExists}`);

        return new Promise((resolve, reject) => {
            let command = ffmpeg().input(voicePath);
            if (bgExists) command = command.input(backgroundPath).inputOptions(['-stream_loop', '-1']);

            const filters: any[] = [];
            if (bgExists) {
                filters.push({ filter: 'volume', options: '0.9', inputs: '0:a', outputs: 'v' });
                filters.push({ filter: 'volume', options: '0.4', inputs: '1:a', outputs: 'b' });
                filters.push({ filter: 'amix', options: { inputs: 2, duration: 'first', dropout_transition: 3 }, inputs: ['v', 'b'], outputs: 'mixed' });
            } else {
                filters.push({ filter: 'volume', options: '0.9', inputs: '0:a', outputs: 'mixed' });
            }

            command
                .complexFilter(filters, 'mixed')
                .audioCodec('libmp3lame')
                .audioBitrate('192k')
                .audioFrequency(44100)
                .audioChannels(2)
                .on('start', (cmd) => this.logger.debug(`FFmpeg: ${cmd}`))
                .on('error', (err, _stdout, stderr) => {
                    this.logger.error(`FFmpeg error: ${err.message} — ${stderr}`);
                    reject(err);
                })
                .on('end', (_stdout, _stderr) => {
                    this.logger.log(`Audio mixed: ${outputPath}`);
                    resolve();
                })
                .save(outputPath);
        });
    }
}
