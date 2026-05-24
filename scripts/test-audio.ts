import { GoogleGenerativeAI } from '@google/generative-ai';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import ffmpeg = require('fluent-ffmpeg');

const execAsync = promisify(exec);

async function testAudioGen() {
  const apiKey = 'AIzaSyCDkH14mx-7Ggwf1FRgkhHx5JQrniEXrYQ'; // From .env
  const theme = 'Improving Morning Routine';
  const mood = 'meditation';
  const filename = 'test_audio';

  console.log('--- Phase 1: AI Script Generation ---');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = `Create a 5-minute narration script for a meditation session focused on: "${theme}". The script should be comprehensive, including pauses and deep breathing instructions. Return ONLY the text.`;
  const result = await model.generateContent(prompt);
  const script = result.response.text().trim();
  console.log(`Script length: ${script.length} characters\n`);
  console.log(`Script snippet: ${script.substring(0, 500)}...\n`);

  console.log('--- Phase 2: TTS (Narration) ---');
  const tempDir = './temp/test';
  const voicePath = path.join(tempDir, `${filename}_voice.aiff`);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  await execAsync(`say "${script.replace(/"/g, '\\"')}" -o ${voicePath}`);
  console.log(`Narration saved to: ${voicePath}`);

  console.log('--- Phase 3: Mixing ---');
  const outputPath = './public/audio/test_mixed.mp3';
  const publicDir = './public/audio';
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(voicePath)
      .audioCodec('libmp3lame')
      .on('error', (err) => {
        console.error(`FFmpeg error: ${err.message}`);
        reject(err);
      })
      .on('end', () => {
        console.log(`SUCCESS! Mixed audio saved to: ${outputPath}`);
        resolve(null);
      })
      .save(outputPath);
  });
}

testAudioGen().catch(console.error);
