import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

async function run() {
    console.log('Testing msedge-tts with an ampersand (&)...');
    const tts = new MsEdgeTTS();
    await tts.setMetadata('en-US-AvaMultilingualNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    
    // @ts-ignore
    const { audioStream } = tts.toStream("This is a test with an ampersand & and a less than <.");
    
    let length = 0;
    // @ts-ignore
    audioStream.on('data', (chunk) => {
        length += chunk.length;
    });
    audioStream.on('end', () => console.log(`stream ended, total bytes received: ${length}`));
    // @ts-ignore
    audioStream.on('error', (err) => console.error('stream error', err));
    
    // @ts-ignore
    // tts.on('error', (err) => console.error('tts error', err));
}
run();
