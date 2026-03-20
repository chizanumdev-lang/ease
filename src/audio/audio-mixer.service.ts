import { Injectable, Logger } from '@nestjs/common';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { WaveFile } from 'wavefile';
import * as fs from 'fs/promises';
import * as path from 'path';

interface BinauralConfig {
  frequency: number;      // Target brainwave (e.g., 14.5 Hz)
  carrierFreq: number;    // Base tone (e.g., 200 Hz)
  duration: number;       // Minutes
  fadeIn: number;         // Seconds
  fadeOut: number;        // Seconds
}

@Injectable()
export class AudioMixerService {
  private readonly logger = new Logger(AudioMixerService.name);
  private ttsClient = new TextToSpeechClient();

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
    // Combine affirmations with pauses
    const affirmationScript = affirmations.join('... ... ... '); // Long pauses
    const fullScript = `${narration} ... ${affirmationScript}`;

    const [response] = await this.ttsClient.synthesizeSpeech({
      input: { text: fullScript },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Neural2-J', // Calm, soothing voice
        ssmlGender: 'NEUTRAL',
      },
      audioConfig: {
        audioEncoding: 'LINEAR16',
        speakingRate: 0.85, // Slower for subliminal effect
        pitch: -2.0,        // Slightly lower pitch
        volumeGainDb: -12.0, // CRITICAL: Very quiet (subliminal)
      },
    });

    return Buffer.from(response.audioContent as Uint8Array);
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

    for (let i = 0; i < binauralLen; i++) {
      const voiceIndex = Math.min(i, voiceChannel0.length - 1);
      
      // Mix with proper balance (80% binaural, 20% voice for subliminal)
      mixedLeft[i] = binauralChannels[0][i] * 0.8 + (voiceChannel0[voiceIndex] || 0) * 0.2;
      mixedRight[i] = binauralChannels[1][i] * 0.8 + (voiceChannel1[voiceIndex] || 0) * 0.2;
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
    outputDir: string
  ): Promise<string> {
    const filename = `audio_${Date.now()}.wav`;
    const outputPath = path.join(outputDir, filename);

    this.logger.log(`Creating binaural track for theme: ${scriptData.theme}`);

    // Step 1: Generate binaural beats
    const binauralBuffer = await this.generateBinauralBeat({
      frequency: scriptData.binauralFrequency,
      carrierFreq: scriptData.carrierFrequency,
      duration: 5,
      fadeIn: 10,
      fadeOut: 15,
    });

    // Step 2: Generate subliminal voice
    const voiceBuffer = await this.generateSubliminalVoice(
      scriptData.affirmations,
      scriptData.backgroundNarration,
      5
    );

    // Step 3: Mix layers
    await this.mixAudioLayers(binauralBuffer, voiceBuffer, outputPath);

    this.logger.log(`Binaural track created successfully at ${outputPath}`);
    return outputPath;
  }
}
