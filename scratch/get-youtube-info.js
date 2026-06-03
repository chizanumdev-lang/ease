const { Innertube } = require('youtubei.js');

async function run() {
  const youtube = await Innertube.create({ client_type: 'WEB' });
  const videoId = 'e0jsbdjsviM';
  const info = await youtube.getInfo(videoId);
  console.log("Title:", info.basic_info.title);
  console.log("Tags:", info.basic_info.keywords);
}
run().catch(console.error);
