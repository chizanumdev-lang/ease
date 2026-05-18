const fs = require('fs');
const path = require('path');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

ffmpeg.setFfmpegPath(ffmpegStatic);

// Mock Logger
const logger = {
    log: (msg) => console.log(`[INFO] ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${msg}`),
    error: (msg, stack) => console.error(`[ERROR] ${msg}`, stack || ''),
    debug: (msg) => console.log(`[DEBUG] ${msg}`)
};

// Mock Config Service
const configService = {
    get: (key) => process.env[key]
};

async function convertAudioToWav(inputBuffer) {
    const tempInputPath = path.join(os.tmpdir(), `vocal_input_${Date.now()}.bin`);
    const tempOutputPath = path.join(os.tmpdir(), `vocal_output_${Date.now()}.wav`);
    
    fs.writeFileSync(tempInputPath, inputBuffer);
    
    return new Promise((resolve, reject) => {
        ffmpeg(tempInputPath)
            .toFormat('wav')
            .on('end', () => {
                try {
                    const outputBuffer = fs.readFileSync(tempOutputPath);
                    fs.unlinkSync(tempInputPath);
                    fs.unlinkSync(tempOutputPath);
                    resolve(outputBuffer);
                } catch (e) {
                    reject(e);
                }
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

async function transcribeWithGroq(audioBuffer, filename, mimeType, locale) {
    const apiKey = configService.get('GROQ_API_KEY');
    if (!apiKey) throw new Error('GROQ_API_KEY not configured');

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType });
    formData.append('file', blob, filename);
    formData.append('model', 'whisper-large-v3');
    
    if (locale) {
        const lang = locale.split('-')[0];
        formData.append('language', lang);
    }

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`
        },
        body: formData
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq Whisper transcription failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    if (!data.text) throw new Error('Empty transcription text returned from Groq');
    return data.text;
}

async function callGroq(prompt) {
    const apiKey = configService.get('GROQ_API_KEY');
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
        }),
    });
    if (!res.ok) throw new Error(`Groq HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
}

function extractJson(text) {
    if (!text) return null;
    try {
        const cleaned = text.replace(/^```json\s*/i, '')
                           .replace(/^```\s*/i, '')
                           .replace(/\s*```$/i, '')
                           .trim();
        try {
            return JSON.parse(cleaned);
        } catch {}

        const jsonMatch = cleaned.match(/\{[\s\S]*\}/) || cleaned.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            let jsonString = jsonMatch[0];
            jsonString = jsonString.replace(/[\u0000-\u001F]/g, (match) => {
                if (match === '\n') return '\\n';
                if (match === '\r') return '\\r';
                if (match === '\t') return '\\t';
                return ''; 
            });
            return JSON.parse(jsonString);
        }
        return null;
    } catch (err) {
        return null;
    }
}

async function gradeVocalPerformanceMock(audioBuffer, targetScript, locale = 'fr-FR', mimeType = 'audio/mp3') {
    if (!audioBuffer) throw new Error('Audio buffer is empty');
    
    logger.log(`Grading vocal performance: ${locale}, ${mimeType}, ${audioBuffer.length} bytes`);
    
    let geminiError = new Error('[GoogleGenerativeAI Error]: Depleted prepayment credits (Simulated)');

    logger.warn(`Primary Gemini grading failed: ${geminiError.message}. Trying Whisper + text LLM fallback...`);

    // --- Fallback logic ---
    try {
        const cleanMime = mimeType.toLowerCase();
        const isGroqSupported = 
            cleanMime.includes('mpeg') || 
            cleanMime.includes('mp3') || 
            cleanMime.includes('wav') || 
            cleanMime.includes('m4a') || 
            cleanMime.includes('ogg') || 
            cleanMime.includes('opus') || 
            cleanMime.includes('flac') || 
            cleanMime.includes('webm');

        let normalizedBuffer = audioBuffer;
        let filename = 'audio.wav';
        let typeForBlob = 'audio/wav';

        if (isGroqSupported) {
            if (cleanMime.includes('mp3')) {
                filename = 'audio.mp3';
                typeForBlob = 'audio/mp3';
            } else if (cleanMime.includes('m4a')) {
                filename = 'audio.m4a';
                typeForBlob = 'audio/m4a';
            } else if (cleanMime.includes('wav')) {
                filename = 'audio.wav';
                typeForBlob = 'audio/wav';
            } else {
                filename = `audio.${cleanMime.split('/')[1] || 'wav'}`;
                typeForBlob = cleanMime;
            }
        } else {
            logger.log(`Audio format ${mimeType} not natively supported by Groq Whisper. Converting to WAV...`);
            normalizedBuffer = await convertAudioToWav(audioBuffer);
            filename = 'audio.wav';
            typeForBlob = 'audio/wav';
        }

        const transcriptionText = await transcribeWithGroq(normalizedBuffer, filename, typeForBlob, locale);
        logger.log(`Whisper transcription successful: "${transcriptionText}"`);

        const fallbackPrompt = `
        You are an expert language coach. Analyze a student's attempt to say: "${targetScript}" in ${locale}.
        The student actually said (transcribed): "${transcriptionText}".
        
        TASKS:
        1. Compare the student's transcription to the target script.
        2. Evaluate Pronunciation, Pace, and Tone (0-100). Since you only have the text transcription, estimate the Pace and Tone based on natural pauses or word completeness.
        3. Identify specific words that were mispronounced, missed, or added by comparing the target to the transcription.
        
        OUTPUT SCHEMA (Strict JSON):
        {
            "score": number (overall 0-100),
            "metrics": {
                "pronunciation": number,
                "pace": number,
                "tone": number
            },
            "mistakes": [
                { "word": string, "correctionLabel": "Pronunciation"|"Phonetic"|"Missing", "feedback": "Short encouraging tip" }
            ],
            "feedback": "Overall encouraging summary"
        }
        
        Return ONLY the raw JSON.`;

        const responseText = await callGroq(fallbackPrompt);
        if (!responseText) throw new Error('Text LLM fallback generated empty response');

        const resultJson = extractJson(responseText);
        if (!resultJson) throw new Error('Could not parse text LLM fallback response as JSON');

        return resultJson;
    } catch (fallbackError) {
        logger.error(`Vocal grading fallback failed: ${fallbackError.message}`, fallbackError.stack);
        throw geminiError || fallbackError;
    }
}

async function run() {
    const audioPath = path.join(__dirname, '../test_say.aiff');
    const audioBuffer = fs.readFileSync(audioPath);
    
    try {
        const result = await gradeVocalPerformanceMock(audioBuffer, "Bonjour, c'est un test de la commande de l'audio génération.", "fr-FR", "audio/x-aiff");
        console.log('\n--- FINAL GRADE OUTCOME ---');
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Final run failed:', err);
    }
}

run();
