import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import axios from 'axios';
import ffmpeg = require('fluent-ffmpeg');

@Injectable()
export class YoutubeAudioService {
  private readonly logger = new Logger(YoutubeAudioService.name);
  private readonly tempDir = path.join(os.tmpdir(), 'ease-yt-audio');

  constructor(private configService: ConfigService) {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    // Lazy load ffmpeg binaries for final normalization or if needed
    try {
      const ffmpegPath = require('ffmpeg-static');
      if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
    } catch (err) {
      this.logger.error(
        'Lazy loading FFmpeg failed in YoutubeAudioService',
        err,
      );
    }
  }

  async extractAudio(videoId: string): Promise<string> {
    const apiKey = this.configService.get<string>('RAPID_API_KEY');
    const outputPath = path.join(this.tempDir, `${videoId}.mp3`);

    if (!apiKey || apiKey === 'your_rapidapi_key_here') {
      this.logger.warn(
        `RAPID_API_KEY is not configured. Falling back to library extraction (Unstable).`,
      );
      throw new Error(
        'RapidAPI Key missing. Please configure RAPID_API_KEY for reliable YouTube extraction.',
      );
    }

    this.logger.log(`Extracting audio for video: ${videoId} using RapidAPI`);

    try {
      // 1. Call RapidAPI to get the download link
      // Using "YouTube MP3 Download" API as recommended
      const options = {
        method: 'GET',
        url: 'https://youtube-mp36.p.rapidapi.com/dl',
        params: { id: videoId },
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com',
        },
      };

      const response = await axios.request(options);

      if (response.data.status !== 'ok' || !response.data.link) {
        this.logger.error(
          `RapidAPI conversion failed: ${JSON.stringify(response.data)}`,
        );
        throw new Error(
          response.data.msg || 'Failed to get download link from RapidAPI',
        );
      }

      const downloadUrl = response.data.link;

      // 2. Download the MP3 file
      this.logger.log(`Downloading converted MP3 from: ${downloadUrl}`);
      const writer = fs.createWriteStream(outputPath);

      const downloadResponse = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'stream',
      });

      downloadResponse.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', (err) => reject(err));
      });

      this.logger.log(`Extraction successful: ${outputPath}`);
      return outputPath;
    } catch (error) {
      this.logger.error(
        `Failed to extract audio for ${videoId} using RapidAPI`,
        error,
      );
      if (error.response?.data) {
        this.logger.error(
          `API Error Details: ${JSON.stringify(error.response.data)}`,
        );
      }
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      throw error;
    }
  }

  cleanup(filePath: string) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      this.logger.warn(`Failed to cleanup file: ${filePath}`, err);
    }
  }
}
