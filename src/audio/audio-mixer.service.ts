import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { WaveFile } from 'wavefile';
import { Readable } from 'stream';
import * as fs from 'fs/promises';
import * as path from 'path';

interface BinauralConfig {
  frequency: number;      // Target brainwave (e.g., 14.5 Hz)
  carrierFreq: number;    // Base tone (e.g., 200 Hz)
  duration: number;       // Minutes
  fadeIn: number;         // Seconds
  fadeOut: number;        // Seconds
}

const STATIC_BINAURAL_MAP: Record<number, string> = {
  4: 'https://res.cloudinary.com/duooultxc/video/upload/v1774276955/ease/audio/static_binaural_4hz.mp3',
  6: 'https://res.cloudinary.com/duooultxc/video/upload/v1774269228/ease/audio/static_binaural_6hz.mp3',
  10: 'https://res.cloudinary.com/duooultxc/video/upload/v1774269306/ease/audio/static_binaural_10hz.mp3',
  15: 'https://res.cloudinary.com/duooultxc/video/upload/v1774277400/ease/audio/static_binaural_15hz.mp3',
  20: 'https://res.cloudinary.com/duooultxc/video/upload/v1774269382/ease/audio/static_binaural_20hz.mp3',
};

@Injectable()
export class AudioMixerService {
  private readonly logger = new Logger(AudioMixerService.name);
  private ttsClient: TextToSpeechClient | null = null;
  private edgeTts = new MsEdgeTTS();

  constructor(private configService: ConfigService) {
    const googleCredentialsJson = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_JSON');
    const googleApiKey = this.configService.get<string>('GOOGLE_API_KEY');
    
    if (googleCredentialsJson || googleApiKey) {
      try {
        const config = googleCredentialsJson 
          ? { credentials: JSON.parse(googleCredentialsJson) }
          : { apiKey: googleApiKey };
          
        this.ttsClient = new TextToSpeechClient(config);
        this.logger.log('Google TTS Client initialized');
      } catch (err) {
        this.logger.error('Failed to initialize Google TTS, will use Edge TTS fallback', err);
      }
    }
  }

  /**
   * Generate binaural beat audio buffer
   */
  async generateBinauralBeat(config: BinauralConfig): Promise<Buffer> {
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
   * Generate subliminal voiceover (very quiet, layered under beats)
   */
  async generateSubliminalVoice(
    affirmations: string[],
    narration: string,
    duration: number
  ): Promise<Buffer> {
    const affirmationScript = affirmations.join('... ... ... ');
    const fullScript = `${narration} ... ${affirmationScript}`;

    // Prefer Google if configured, otherwise use Edge TTS (No Key Required)
    if (this.ttsClient) {
      try {
        const [response] = await this.ttsClient.synthesizeSpeech({
          input: { text: fullScript },
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
    
    // Use temporary files to avoid stream closure issues with fluent-ffmpeg
    const os = require('os');
    const crypto = require('crypto');
    const tempId = crypto.randomBytes(8).toString('hex');
    const tempMp3Path = path.join(os.tmpdir(), `ease-tts-${tempId}.mp3`);
    const tempWavPath = path.join(os.tmpdir(), `ease-tts-${tempId}.wav`);

    try {
      await this.edgeTts.setMetadata('en-US-GuyNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      
      // Use toStream and manually write to file because toFile expects a directory
      const { audioStream } = this.edgeTts.toStream(fullScript);
      const fsCore = require('fs');
      const writeStream = fsCore.createWriteStream(tempMp3Path);
      
      await new Promise<void>((resolve, reject) => {
        audioStream.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        audioStream.on('error', reject);
      });
      
      const ffmpeg = require('fluent-ffmpeg');
      const ffmpegPath = require('ffmpeg-static');
      ffmpeg.setFfmpegPath(ffmpegPath);
      
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempMp3Path)
          .toFormat('wav')
          .audioFrequency(44100)
          .audioChannels(1)
          .on('error', (err: any) => {
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
        fs.unlink(tempWavPath).catch(() => {})
      ]);

      return finalBuffer;
    } catch (err) {
      this.logger.error('Edge TTS or conversion failed', err);
      // Cleanup on error
      await Promise.all([
        fs.unlink(tempMp3Path).catch(() => {}),
        fs.unlink(tempWavPath).catch(() => {})
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
    outputPath: string
  ): Promise<string> {
    // Load audio buffers
    const binauralWav = new WaveFile(binauralBuffer);
    const voiceWav = new WaveFile(voiceBuffer);

    // Ensure both are same sample rate (standardize to 44.1kHz)
    if ((voiceWav.fmt as any).sampleRate !== 44100) {
      voiceWav.toSampleRate(44100);
    }
    
    // Get samples (non-interleaved)
    const binauralSamplesRaw = binauralWav.getSamples(false, Float32Array);
    const voiceSamplesRaw = voiceWav.getSamples(false, Float32Array);
    
    // Robustly handle both array-of-channels and flat-array (mono) returns
    const binauralChannels = Array.isArray(binauralSamplesRaw) && (binauralSamplesRaw[0] as any).length !== undefined
      ? binauralSamplesRaw as Float32Array[]
      : [binauralSamplesRaw as unknown as Float32Array];

    const voiceChannels = Array.isArray(voiceSamplesRaw) && (voiceSamplesRaw[0] as any).length !== undefined
      ? voiceSamplesRaw as Float32Array[]
      : [voiceSamplesRaw as unknown as Float32Array];

    // Mix: binaural (main) + voice (subliminal layer)
    const binauralLen = binauralChannels[0].length;
    const voiceChannel0 = voiceChannels[0];
    const voiceChannel1 = voiceChannels[1] || voiceChannel0; // Fallback to mono if needed
    
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
   * Master pipeline: Generate complete binaural + subliminal track
   */
  async createBinauralSubliminalTrack(
    scriptData: any,
    outputDir: string,
    duration: number = 5
  ): Promise<string> {
    const filename = `audio_${Date.now()}.mp3`;
    const outputPath = path.join(outputDir, filename);

    this.logger.log(`Creating binaural track for theme: ${scriptData.theme} (MP3)`);

    // 1. Generate Voiceover (Local File)
    const voiceBuffer = await this.generateSubliminalVoice(
      scriptData.affirmations,
      scriptData.backgroundNarration,
      duration
    );
    
    const tempVoicePath = path.join(outputDir, `temp_voice_${Date.now()}.wav`);
    await fs.writeFile(tempVoicePath, voiceBuffer);

    // 2. Mix with Binaural (Static from URL)
    const availableFrequencies = Object.keys(STATIC_BINAURAL_MAP).map(Number);
    const targetFreq = scriptData.binauralFrequency;
    
    // Find closest frequency
    const closestFreq = availableFrequencies.reduce((prev, curr) => {
      return (Math.abs(curr - targetFreq) < Math.abs(prev - targetFreq) ? curr : prev);
    });

    const staticUrl = STATIC_BINAURAL_MAP[closestFreq];
    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegPath = require('ffmpeg-static');
    ffmpeg.setFfmpegPath(ffmpegPath);

    return new Promise<string>((resolve, reject) => {
      let command = ffmpeg();

      if (staticUrl) {
        this.logger.log(`Using static binaural beat for ${closestFreq}Hz (requested ${targetFreq}Hz)`);
        command.input(staticUrl).input(tempVoicePath);
      } else {
        // Fallback (though reduce ensures we get one)
        reject(new Error(`No static beat available for ${targetFreq}Hz`));
        return;
      }

      command
        .complexFilter([
          '[0:a]volume=1.0,aloop=loop=-1:size=2e9[bg]', // Loop the 1min beat if needed
          '[1:a]volume=0.1[voice]',
          '[bg][voice]amix=inputs=2:duration=first[out]'
        ])
        .setDuration(duration * 60)
        .map('[out]')
        .audioCodec('libmp3lame')
        .audioBitrate('64k')
        .on('error', (err: any) => {
          this.logger.error('FFMPEG Mixing Error', err);
          reject(err);
        })
        .on('end', async () => {
          this.logger.log(`Mixed audio saved to ${outputPath}`);
          await fs.unlink(tempVoicePath).catch(() => {});
          resolve(outputPath);
        })
        .save(outputPath);
    });
  }
}
