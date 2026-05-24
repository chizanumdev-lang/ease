const { Innertube } = require('youtubei.js');

async function run() {
  const yt = await Innertube.create();
  const info = await yt.getInfo('LXX_qOA5D8E');
  console.log("Title:", info.basic_info.title);
  try {
    const transcript = await info.getTranscript();
    const text = transcript.transcript.content.body.initial_segments.map(seg => seg.snippet.text).join(' ');
    console.log(text.substring(0, 1000) + '...');
  } catch(e) {
    console.error("No transcript found:", e.message);
  }
}
run();
