import { Test, TestingModule } from '@nestjs/testing';
import { AudioMixerService } from './audio-mixer.service';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import * as fs from 'fs/promises';
import { WaveFile } from 'wavefile';

jest.mock('@google-cloud/text-to-speech');
jest.mock('fs/promises');

describe('AudioMixerService', () => {
  let service: AudioMixerService;
  let ttsClientMock: any;

  beforeEach(async () => {
    ttsClientMock = {
      synthesizeSpeech: jest.fn().mockResolvedValue([{
        audioContent: Buffer.from('mock audio content'),
      }]),
    };
    (TextToSpeechClient as any).mockImplementation(() => ttsClientMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [AudioMixerService],
    }).compile();

    service = module.get<AudioMixerService>(AudioMixerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateBinauralBeat', () => {
    it('should generate a valid WAV buffer with correct duration', async () => {
      const config = {
        frequency: 10,
        carrierFreq: 200,
        duration: 0.1, // 6 seconds for fast test
        fadeIn: 1,
        fadeOut: 1,
      };

      const buffer = await service.generateBinauralBeat(config);
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);

      const wav = new WaveFile(buffer);
      const samples = wav.getSamples(false, Float32Array);
      
      // Stereo (2 channels)
      expect(samples.length).toBe(2);
      
      // Expected sample count: 0.1 min * 60 sec * 44100 Hz = 264600
      const expectedSamples = 6 * 44100;
      expect((samples[0] as any).length).toBe(expectedSamples);
    });
  });

  describe('mixAudioLayers', () => {
    it('should mix binaural and voice layers and save to file', async () => {
      // Create 1 second mock buffers
      const sampleRate = 44100;
      const samples = sampleRate;
      
      const binauralWav = new WaveFile();
      binauralWav.fromScratch(2, sampleRate, '32f', [
        new Float32Array(samples).fill(1.0), 
        new Float32Array(samples).fill(1.0)
      ]);
      const binauralBuffer = Buffer.from(binauralWav.toBuffer());

      const voiceWav = new WaveFile();
      voiceWav.fromScratch(1, sampleRate, '32f', [
        new Float32Array(samples).fill(0.5)
      ]);
      const voiceBuffer = Buffer.from(voiceWav.toBuffer());

      const outputPath = '/tmp/test_output.wav';
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      // Spy on WaveFile if needed, or just check the output again.
      const resultPath = await service.mixAudioLayers(binauralBuffer, voiceBuffer, outputPath);

      expect(resultPath).toBe(outputPath);
      const writtenBuffer = (fs.writeFile as jest.Mock).mock.calls[0][1];
      const resultWav = new WaveFile(writtenBuffer);
      const resultSamples = resultWav.getSamples(false, Float32Array);
      
      const leftSample = (resultSamples[0] as any)[0];
      const rightSample = (resultSamples[1] as any)[0];
      
      console.log('Test mixing result - left:', leftSample, 'right:', rightSample);
      
      expect(leftSample).toBeCloseTo(0.9, 5);
      expect(rightSample).toBeCloseTo(0.9, 5);
    });
  });
});
