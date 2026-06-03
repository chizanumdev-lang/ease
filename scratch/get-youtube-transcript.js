const { Innertube } = require('youtubei.js');

async function run() {
  const youtube = await Innertube.create({ client_type: 'WEB' });
  const videoId = 'e0jsbdjsviM';
  const info = await youtube.getInfo(videoId);
  
  try {
    const transcript = await info.getTranscript();
    console.log("Transcript for video", videoId);
    console.log(transcript.transcript.content.body.initial_segments.map(s => s.snippet.text).join(' ').substring(0, 5000));
  } catch (e) {
    console.log("No transcript available.", e.message);
    console.log("Description instead:", info.basic_info.short_description);
  }
}
run().catch(console.error);
