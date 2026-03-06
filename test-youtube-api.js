const axios = require('axios');
require('dotenv').config();

async function testYouTubeEndpoint() {
    const API_URL = 'http://localhost:3000/api/recommend-video';
    const TEST_TOPICS = [
        "React hooks for beginners",
        "How to bake sourdough bread",
        "Advanced Juggling Techniques"
    ];

    console.log("Testing YouTube Recommendation API...\n");

    for (const topic of TEST_TOPICS) {
        console.log(`Topic: "${topic}"`);
        try {
            const start = Date.now();
            const response = await axios.post(API_URL, { topic });
            const duration = Date.now() - start;

            console.log(`✅ Success (${duration}ms):`);
            console.log(`   Title: ${response.data.title}`);
            console.log(`   URL:   ${response.data.url}`);
            console.log(`   Channel: ${response.data.channel}`);
            console.log(`   Cached? ${duration < 200 ? 'YES (Likely)' : 'NO'}\n`);
        } catch (error) {
            if (error.response) {
                console.log(`❌ Error ${error.response.status}: ${JSON.stringify(error.response.data)}\n`);
            } else {
                console.log(`❌ Network Error: ${error.message}\n`);
            }
        }
    }
}

// Check if server is running before testing
testYouTubeEndpoint();
