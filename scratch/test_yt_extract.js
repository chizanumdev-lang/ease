const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

async function testExtraction() {
    const videoId = 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up (Classic test)
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const rawPath = path.join(__dirname, 'test_raw.webm');
    const outputPath = path.join(__dirname, 'test_output.mp3');

    console.log('--- YouTube Audio Extraction Test ---');
    console.log(`URL: ${url}`);

    try {
        // 1. Download
        console.log('Step 1: Downloading raw audio...');
        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' }) || 
                       ytdl.chooseFormat(info.formats, { filter: 'audioonly' });

        if (!format) {
            console.error('Available formats:', info.formats.map(f => f.mimeType).join(', '));
            throw new Error('No audio format found');
        }

        console.log(`Matching format found: ${format.mimeType} / ${format.qualityLabel || 'audio-only'}`);

        await new Promise((resolve, reject) => {
            const stream = ytdl.downloadFromInfo(info, { format });
            const fileStream = fs.createWriteStream(rawPath);
            stream.pipe(fileStream);

            fileStream.on('finish', () => {
                console.log('Download finished.');
                resolve(undefined);
            });
            stream.on('error', (err) => {
                console.error('Stream error:', err);
                reject(err);
            });
        });

        // 2. Convert
        console.log('Step 2: Converting to MP3...');
        // Pre-set paths if they exist in usual locations
        const ffmpegPath = '/usr/local/bin/ffmpeg'; 
        if (fs.existsSync(ffmpegPath)) ffmpeg.setFfmpegPath(ffmpegPath);

        await new Promise((resolve, reject) => {
            ffmpeg(rawPath)
                .toFormat('mp3')
                .audioBitrate(128)
                .on('error', (err) => {
                    console.error('FFmpeg error:', err.message);
                    reject(err);
                })
                .on('end', () => {
                    console.log('Conversion successful.');
                    resolve(undefined);
                })
                .save(outputPath);
        });

        console.log(`Test PASSED. Output created at: ${outputPath}`);
        
        // Cleanup raw
        if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
        
    } catch (error) {
        console.error('Test FAILED:', error);
    }
}

testExtraction();
