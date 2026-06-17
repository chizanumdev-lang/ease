import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { WaveFile } from 'wavefile';
import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import * as os from 'os';
import * as crypto from 'crypto';
import * as fsCore from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import * as ffprobeStatic from 'ffprobe-static';

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
const ffprobeStaticPath = (ffprobeStatic as unknown as { path?: string }).path;
if (ffprobeStaticPath) {
  ffmpeg.setFfprobePath(ffprobeStaticPath);
}

interface BinauralConfig {
  frequency: number; // Target brainwave (e.g., 14.5 Hz)
  carrierFreq: number; // Base tone (e.g., 200 Hz)
  duration: number; // Minutes
  fadeIn: number; // Seconds
  fadeOut: number; // Seconds
}

const STATIC_BINAURAL_MAP: Record<number, string> = {
  4: 'https://res.cloudinary.com/duooultxc/video/upload/v1774276955/ease/audio/static_binaural_4hz.mp3',
  6: 'https://res.cloudinary.com/duooultxc/video/upload/v1774269228/ease/audio/static_binaural_6hz.mp3',
  10: 'https://res.cloudinary.com/duooultxc/video/upload/v1774269306/ease/audio/static_binaural_10hz.mp3',
  15: 'https://res.cloudinary.com/duooultxc/video/upload/v1774277400/ease/audio/static_binaural_15hz.mp3',
  20: 'https://res.cloudinary.com/duooultxc/video/upload/v1774269382/ease/audio/static_binaural_20hz.mp3',
};

export interface SubliminalScript {
  theme: string;
  affirmations: string[];
  introNarration: string;
  outroNarration: string;
  binauralFrequency: number;
}

@Injectable()
export class AudioMixerService {
  private readonly logger = new Logger(AudioMixerService.name);
  private ttsClient: TextToSpeechClient | null = null;

  constructor(private configService: ConfigService) {
    const googleCredentialsJson = this.configService.get<string>(
      'GOOGLE_SERVICE_ACCOUNT_JSON',
    );
    const googleApiKey = this.configService.get<string>('GOOGLE_API_KEY');

    if (googleCredentialsJson || googleApiKey) {
      try {
        const config = googleCredentialsJson
          ? {
              credentials: JSON.parse(googleCredentialsJson) as Record<
                string,
                unknown
              >,
            }
          : { apiKey: googleApiKey };

        this.ttsClient = new TextToSpeechClient(config);
        this.logger.log('Google TTS Client initialized');
      } catch (err) {
        this.logger.error(
          'Failed to initialize Google TTS, will use Edge TTS fallback',
          err,
        );
      }
    }
  }

  /**
   * Generate binaural beat audio buffer
   */
  async generateBinauralBeat(config: BinauralConfig): Promise<Buffer> {
    await Promise.resolve();
    const durationSeconds = config.duration * 60;
    const sampleRate = 44100;
    const totalSamples = sampleRate * durationSeconds;

    // Create stereo buffer
    const leftChannel = new Float32Array(totalSamples);
    const rightChannel = new Float32Array(totalSamples);

    // Left ear: carrier frequency
    // Right ear: carrier + binaural offset
    const leftFreq = config.carrierFreq;
    const rightFreq = config.carrierFreq + config.frequency;

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;

      // Generate sine waves
      const leftSample = Math.sin(2 * Math.PI * leftFreq * t);
      const rightSample = Math.sin(2 * Math.PI * rightFreq * t);

      // Apply fade in/out envelopes
      let amplitude = 0.3; // Base volume (30%)

      if (t < config.fadeIn) {
        amplitude *= t / config.fadeIn; // Fade in
      } else if (t > durationSeconds - config.fadeOut) {
        amplitude *= (durationSeconds - t) / config.fadeOut; // Fade out
      }

      leftChannel[i] = leftSample * amplitude;
      rightChannel[i] = rightSample * amplitude;
    }

    // Convert to WAV
    const wav = new WaveFile();
    wav.fromScratch(2, sampleRate, '32f', [leftChannel, rightChannel]);
    return Buffer.from(wav.toBuffer());
  }

  /**
   * Synthesize text to WAV buffer using TTS
   */
  async synthesizeTextToWav(text: string): Promise<Buffer> {
    // Prefer Google if configured, otherwise use Edge TTS (No Key Required)
    if (this.ttsClient) {
      try {
        const [response] = await this.ttsClient.synthesizeSpeech({
          input: { text },
          voice: {
            languageCode: 'en-US',
            name: 'en-US-Neural2-J',
            ssmlGender: 'NEUTRAL',
          },
          audioConfig: {
            audioEncoding: 'LINEAR16',
            speakingRate: 0.85,
            pitch: -2.0,
            volumeGainDb: -12.0,
          },
        });
        return Buffer.from(response.audioContent as Uint8Array);
      } catch (err) {
        this.logger.warn('Google TTS failed, falling back to Edge TTS', err);
      }
    }

    // Edge TTS Fallback (Zero Config)
    this.logger.log('Generating voiceover using Edge TTS (Zero Config)...');

    // Create local instance to prevent concurrency issues with shared WebSocket state
    const edgeTts = new MsEdgeTTS();

    // Use temporary files to avoid stream closure issues with fluent-ffmpeg
    const tempId = crypto.randomBytes(8).toString('hex');
    const tempMp3Path = path.join(os.tmpdir(), `ease-tts-${tempId}.mp3`);
    const tempWavPath = path.join(os.tmpdir(), `ease-tts-${tempId}.wav`);

    try {
      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts) {
        try {
          // Pass empty metadataOptions to prevent "Cannot read properties of undefined (reading 'voiceLocale')"
          await edgeTts.setMetadata(
            'en-US-GuyNeural',
            OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
            {},
          );

          const { audioStream } = edgeTts.toStream(text);
          const writeStream = fsCore.createWriteStream(tempMp3Path);

          await new Promise<void>((resolve, reject) => {
            audioStream.pipe(writeStream);
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
            audioStream.on('error', reject);
          });
          break; // Success!
        } catch (err: unknown) {
          attempts++;
          const errMsg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Edge TTS attempt ${attempts} failed: ${errMsg}`);
          if (attempts >= maxAttempts) throw err;
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s
        }
      }

      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempMp3Path)
          .toFormat('wav')
          .audioFrequency(44100)
          .audioChannels(1)
          .on('error', (err: Error) => {
            this.logger.error('ffmpeg processing error', err);
            reject(err);
          })
          .on('end', () => resolve())
          .save(tempWavPath);
      });

      const finalBuffer = await fs.readFile(tempWavPath);

      // Cleanup
      await Promise.all([
        fs.unlink(tempMp3Path).catch(() => {}),
        fs.unlink(tempWavPath).catch(() => {}),
      ]);

      return finalBuffer;
    } catch (err) {
      this.logger.error('Edge TTS or conversion failed', err);
      // Cleanup on error
      await Promise.all([
        fs.unlink(tempMp3Path).catch(() => {}),
        fs.unlink(tempWavPath).catch(() => {}),
      ]);
      throw err;
    }
  }

  /**
   * Mix binaural beats + subliminal voice into final track
   */
  async mixAudioLayers(
    binauralBuffer: Buffer,
    voiceBuffer: Buffer,
    outputPath: string,
  ): Promise<string> {
    // Load audio buffers
    const binauralWav = new WaveFile(binauralBuffer);
    const voiceWav = new WaveFile(voiceBuffer);

    // Ensure both are same sample rate (standardize to 44.1kHz)
    if ((voiceWav.fmt as { sampleRate: number }).sampleRate !== 44100) {
      voiceWav.toSampleRate(44100);
    }

    // Get samples (non-interleaved)
    const binauralSamplesRaw = binauralWav.getSamples(
      false,
      Float32Array,
    ) as unknown as Float32Array[] | Float32Array;
    const voiceSamplesRaw = voiceWav.getSamples(
      false,
      Float32Array,
    ) as unknown as Float32Array[] | Float32Array;

    // Robustly handle both array-of-channels and flat-array (mono) returns
    const binauralChannels = Array.isArray(binauralSamplesRaw)
      ? binauralSamplesRaw
      : [binauralSamplesRaw];

    const voiceChannels = Array.isArray(voiceSamplesRaw)
      ? voiceSamplesRaw
      : [voiceSamplesRaw];

    // Mix: binaural (main) + voice (subliminal layer)
    const binauralLen = binauralChannels[0].length;

    const mixedLeft = new Float32Array(binauralLen);
    const mixedRight = new Float32Array(binauralLen);

    // Cache channel references and lengths for speed
    const bCh0 = binauralChannels[0];
    const bCh1 = binauralChannels[1] || bCh0;
    const vCh0 = voiceChannels[0];
    const vCh1 = voiceChannels[1] || vCh0;
    const vLen = vCh0.length;

    for (let i = 0; i < binauralLen; i++) {
      // Subliminal voiceover should loop or stop if shorter
      // Typically it matches or is shorter than the background
      const vIdx = i < vLen ? i : vLen - 1;

      mixedLeft[i] = bCh0[i] * 0.8 + (vCh0[vIdx] || 0) * 0.2;
      mixedRight[i] = bCh1[i] * 0.8 + (vCh1[vIdx] || 0) * 0.2;
    }

    // Create final WAV
    const finalWav = new WaveFile();
    finalWav.fromScratch(2, 44100, '32f', [mixedLeft, mixedRight]);

    // Save to file
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, finalWav.toBuffer());
    return outputPath;
  }

  /**
   * Helper to download a file to local temp storage
   */
  private async downloadToTemp(
    url: string,
    outputDir: string,
  ): Promise<string> {
    const filename = `temp_bg_${Date.now()}_${path.basename(url)}`;
    const outputPath = path.join(outputDir, filename);

    this.logger.log(`Downloading background audio from URL: ${url}`);
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 10000, // 10s timeout
    });

    await fs.writeFile(outputPath, Buffer.from(response.data));
    return outputPath;
  }

  /**
   * Master pipeline: Generate complete binaural + subliminal track
   */
  async createBinauralSubliminalTrack(
    scriptData: SubliminalScript,
    outputDir: string,
    duration: number = 5,
  ): Promise<string> {
    const filename = `audio_${Date.now()}.mp3`;
    const outputPath = path.join(outputDir, filename);

    this.logger.log(
      `Creating binaural track for theme: ${scriptData.theme} (MP3)`,
    );

    // 1. Synthesize Voiceover parts (Local Files)
    const introBuffer = await this.synthesizeTextToWav(
      scriptData.introNarration,
    );
    const outroBuffer = await this.synthesizeTextToWav(
      scriptData.outroNarration,
    );

    const tempIntroPath = path.join(outputDir, `temp_intro_${Date.now()}.wav`);
    const tempOutroPath = path.join(outputDir, `temp_outro_${Date.now()}.wav`);
    const concatTxtPath = path.join(outputDir, `concat_${Date.now()}.txt`);

    await fs.writeFile(tempIntroPath, introBuffer);
    await fs.writeFile(tempOutroPath, outroBuffer);

    // Chunk affirmations into groups of 10 to avoid Edge TTS text limits
    const affsTempPaths: string[] = [];
    const chunkSize = 10;

    for (let i = 0; i < scriptData.affirmations.length; i += chunkSize) {
      const chunkText = scriptData.affirmations
        .slice(i, i + chunkSize)
        .join('... ... ... ');
      this.logger.log(`Synthesizing affirmations chunk ${i / chunkSize + 1}`);
      const chunkBuffer = await this.synthesizeTextToWav(chunkText);
      const chunkPath = path.join(
        outputDir,
        `temp_affs_${Date.now()}_${i}.wav`,
      );
      await fs.writeFile(chunkPath, chunkBuffer);
      affsTempPaths.push(chunkPath);
    }

    // Probe duration of first affirmation chunk to estimate loop count
    let affsDuration = 30; // fallback
    if (affsTempPaths.length > 0) {
      try {
        affsDuration = await new Promise<number>((resolve, reject) => {
          ffmpeg.ffprobe(
            affsTempPaths[0],
            (err: Error | null, metadata: unknown) => {
              if (err) {
                reject(err);
              } else {
                const ffprobeData = metadata as {
                  format?: { duration?: string | number };
                };
                const parsed = parseFloat(
                  String(ffprobeData?.format?.duration),
                );
                resolve(isNaN(parsed) ? 30 : parsed);
              }
            },
          );
        });
        // Multiply by number of chunks to get total affirmation loop duration
        affsDuration *= affsTempPaths.length;
        this.logger.log(
          `Estimated total affirmations duration: ${affsDuration} seconds`,
        );
      } catch (err: unknown) {
        this.logger.warn(
          `ffprobe failed for affirmations. Falling back to default duration.`,
        );
      }
    }

    const finalDuration = duration * 60; // target duration in seconds

    // We want the track to be at least finalDuration long.
    const loopsNeeded = Math.ceil(finalDuration / affsDuration) + 1;

    // Create FFmpeg concat demuxer text file
    let concatText = `file '${tempIntroPath}'\n`;
    for (let i = 0; i < loopsNeeded; i++) {
      for (const affPath of affsTempPaths) {
        concatText += `file '${affPath}'\n`;
      }
    }
    concatText += `file '${tempOutroPath}'\n`;

    await fs.writeFile(concatTxtPath, concatText);

    // 2. Mix with Binaural (Static from URL)
    const availableFrequencies = Object.keys(STATIC_BINAURAL_MAP).map(Number);
    const targetFreq = scriptData.binauralFrequency;

    // Find closest frequency
    const closestFreq = availableFrequencies.reduce((prev, curr) => {
      return Math.abs(curr - targetFreq) < Math.abs(prev - targetFreq)
        ? curr
        : prev;
    });

    const staticUrl = STATIC_BINAURAL_MAP[closestFreq];
    const tempStaticPath = staticUrl
      ? await this.downloadToTemp(staticUrl, outputDir)
      : null;

    this.logger.log(
      `Setting final mixed track duration to: ${finalDuration} seconds`,
    );

    const voiceVolume = 0.8;
    const backgroundVolume = 0.8;

    return new Promise<string>((resolve, reject) => {
      const command = ffmpeg();

      if (tempStaticPath) {
        this.logger.log(
          `Using static binaural beat for ${closestFreq}Hz (requested ${targetFreq}Hz)`,
        );
        // Background track (input 0)
        command.input(tempStaticPath);
        // Concatenated voiceover track (input 1)
        command
          .input(concatTxtPath)
          .inputOptions(['-f', 'concat', '-safe', '0']);
      } else {
        reject(new Error(`No static beat available for ${targetFreq}Hz`));
        return;
      }

      command
        .complexFilter([
          `[0:a]volume=${backgroundVolume},aloop=loop=-1:size=2e9[bg]`,
          `[1:a]volume=${voiceVolume}[voice]`,
          '[bg][voice]amix=inputs=2:duration=first[out]',
        ])
        .setDuration(finalDuration)
        .map('[out]')
        .audioCodec('libmp3lame')
        .audioBitrate('64k')
        .on('error', (err: Error) => {
          this.logger.error('FFMPEG Mixing Error', err);
          const cleanup = async () => {
            await Promise.all([
              fs.unlink(tempIntroPath).catch(() => {}),
              ...affsTempPaths.map((p) => fs.unlink(p).catch(() => {})),
              fs.unlink(tempOutroPath).catch(() => {}),
              fs.unlink(concatTxtPath).catch(() => {}),
              tempStaticPath
                ? fs.unlink(tempStaticPath).catch(() => {})
                : Promise.resolve(),
            ]);
          };
          cleanup().finally(() => reject(err));
        })
        .on('end', () => {
          this.logger.log(`Mixed audio saved to ${outputPath}`);
          const cleanup = async () => {
            await Promise.all([
              fs.unlink(tempIntroPath).catch(() => {}),
              ...affsTempPaths.map((p) => fs.unlink(p).catch(() => {})),
              fs.unlink(tempOutroPath).catch(() => {}),
              fs.unlink(concatTxtPath).catch(() => {}),
              tempStaticPath
                ? fs.unlink(tempStaticPath).catch(() => {})
                : Promise.resolve(),
            ]);
          };
          cleanup().finally(() => resolve(outputPath));
        })
        .save(outputPath);
    });
  }
}
