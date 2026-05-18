const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

function convertAudio(inputBuffer, outputFormat = 'wav') {
    return new Promise((resolve, reject) => {
        const tempInputPath = path.join(__dirname, `temp_input_${Date.now()}.aiff`);
        const tempOutputPath = path.join(__dirname, `temp_output_${Date.now()}.${outputFormat}`);
        
        fs.writeFileSync(tempInputPath, inputBuffer);
        
        ffmpeg(tempInputPath)
            .toFormat(outputFormat)
            .on('end', () => {
                const outputBuffer = fs.readFileSync(tempOutputPath);
                // Clean up temp files
                try {
                    fs.unlinkSync(tempInputPath);
                    fs.unlinkSync(tempOutputPath);
                } catch (e) {
                    console.warn('Failed to delete temp files:', e);
                }
                resolve(outputBuffer);
            })
            .on('error', (err) => {
                try {
                    fs.unlinkSync(tempInputPath);
                    fs.unlinkSync(tempOutputPath);
                } catch (e) {}
                reject(err);
            })
            .save(tempOutputPath);
    });
}

async function testWhisper() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error('GROQ_API_KEY not found in .env');
        return;
    }

    const audioPath = path.join(__dirname, '../test_say.aiff');
    if (!fs.existsSync(audioPath)) {
        console.error(`Audio file not found at ${audioPath}`);
        return;
    }

    const audioBuffer = fs.readFileSync(audioPath);
    console.log(`Read audio file: ${audioBuffer.length} bytes`);

    try {
        console.log('Converting audio to WAV format...');
        const wavBuffer = await convertAudio(audioBuffer, 'wav');
        console.log(`Converted to WAV: ${wavBuffer.length} bytes`);

        const formData = new FormData();
        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        formData.append('file', blob, 'audio.wav');
        formData.append('model', 'whisper-large-v3');
        formData.append('language', 'fr');

        console.log('Sending request to Groq Whisper API...');
        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq Whisper API responded with ${response.status}: ${errText}`);
        }

        const result = await response.json();
        console.log('TRANSCRIPTION SUCCESS:', result);
    } catch (error) {
        console.error('TRANSCRIPTION FAILED:', error);
    }
}

testWhisper();
