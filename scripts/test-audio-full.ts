import { GoogleGenerativeAI } from '@google/generative-ai';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import ffmpeg = require('fluent-ffmpeg');

const execAsync = promisify(exec);

async function testFullAudioGen() {
  const apiKey = 'AIzaSyCDkH14mx-7Ggwf1FRgkhHx5JQrniEXrYQ'; // From .env
  const theme = 'Deep Relaxation & Stress Relief';
  const mood = 'meditation';
  const filename = 'test_full_5min';

  console.log('--- Phase 1: AI Script Generation (5 Minutes) ---');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an expert mindfulness and productivity coach. 
    Create a comprehensive 5-minute narration script for a ${mood} session focused on: "${theme}".
    
    Guidelines:
    - Mood: ${mood}
    - Tone: Calm, encouraging, and professional.
    - Content: Include deep breathing instructions, visualizations, and progressive muscle relaxation or mindfulness techniques appropriate for the mood.
    - Structure: 
        1. Gentle introduction (30 sec)
        2. Core practice or guidance (4 minutes)
        3. Grounding closing (30 sec)
    - Total word count: MUST be between 750 and 850 words to ensure a 5-minute duration at normal speaking pace.
    
    Return ONLY the spoken text. No stage directions, no labels like "Intro:", just the content to be read aloud.`;

  const result = await model.generateContent(prompt);
  const script = result.response.text().trim();
  console.log(
    `Script length: ${script.length} characters (~${Math.round(script.split(' ').length)} words)\n`,
  );
  console.log(`Snippet: ${script.substring(0, 500)}...\n`);

  console.log('--- Phase 2: TTS (Narration) ---');
  const tempDir = './temp/test';
  const voicePath = path.join(tempDir, `${filename}_voice.aiff`);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  // Using temporary shell script approach to avoid ARG_MAX issues with very long strings
  const scriptPath = path.join(tempDir, `${filename}_script.txt`);
  fs.writeFileSync(scriptPath, script);

  console.log(`Running 'say' command...`);
  await execAsync(`say -f ${scriptPath} -o ${voicePath}`);
  console.log(`Narration saved to: ${voicePath}`);

  console.log('--- Phase 3: Mixing ---');
  const backgroundPath = `./assets/audio/backgrounds/${mood}.mp3`;
  const outputPath = `./public/audio/${filename}.mp3`;
  const publicDir = './public/audio';
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  return new Promise((resolve, reject) => {
    let command = ffmpeg();
    command = command.input(voicePath);

    if (fs.existsSync(backgroundPath)) {
      console.log(`Using background: ${backgroundPath}`);
      command = command.input(backgroundPath).inputOptions(['-stream_loop -1']);
    }

    command
      .complexFilter(
        [
          '[0:a]volume=1.5[voice]',
          fs.existsSync(backgroundPath) ? '[1:a]volume=0.15[bg]' : '',
          fs.existsSync(backgroundPath)
            ? '[voice][bg]amix=inputs=2:duration=first[a]'
            : '[voice]copy[a]',
        ].filter((f) => f !== ''),
      )
      .map('[a]')
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

testFullAudioGen().catch(console.error);
