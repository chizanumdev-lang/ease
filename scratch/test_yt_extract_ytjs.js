const { Innertube } = require('youtubei.js');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

async function testExtraction() {
    const videoId = 'dQw4w9WgXcQ'; // Rick Astley
    const outputPath = path.join(__dirname, 'test_output_ytjs.mp3');

    console.log('--- YouTube Audio Extraction Test (youtubei.js) ---');
    console.log(`Video ID: ${videoId}`);

    try {
        console.log('Step 1: Initializing Innertube with TVHTML5...');
        const youtube = await Innertube.create({
            client_type: 'TVHTML5'
        });
        
        console.log('Step 2: Fetching video info...');
        const video = await youtube.getInfo(videoId);
        
        console.log('Step 3: Choosing best audio format...');
        const format = video.chooseFormat({ type: 'audio', quality: 'best' });
        
        if (!format) {
            throw new Error('No audio format found');
        }
        console.log(`Format found: ${format.mime_type}`);

        // youtubei.js often requires deciphering
        // But for many videos, format.url is enough if deciphered
        // Actually, youtubei.js handles stream download directly
        
        console.log('Step 4: Downloading and converting to MP3...');
        const stream = await video.download({
            type: 'audio',
            quality: 'best',
            format: 'any'
        });

        // Conversion using fluent-ffmpeg
        const ffmpegPath = '/usr/local/bin/ffmpeg'; 
        if (fs.existsSync(ffmpegPath)) ffmpeg.setFfmpegPath(ffmpegPath);

        await new Promise((resolve, reject) => {
            // video.download returns a ReadableStream
            // We need to convert it to a node stream or just pipe it?
            // Innertube's download returns a Web Stream in some versions, or a Node Stream.
            // Let's check.
            
            ffmpeg(stream)
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
        
    } catch (error) {
        console.error('Test FAILED:', error);
    }
}

testExtraction();
