const { GoogleGenerativeAI } = require("@google/generative-ai");
const https = require('https');
require('dotenv').config();

async function checkUrl(url) {
    return new Promise((resolve) => {
        if (!url || !url.includes('youtube.com/watch')) {
            resolve({ valid: false, status: 'Invalid Format' });
            return;
        }
        https.get(url, (res) => {
            resolve({ valid: res.statusCode === 200, status: res.statusCode });
        }).on('error', () => {
            resolve({ valid: false, status: 'Error' });
        });
    });
}

async function testVideoLinks() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const topics = [
        "Learn to Juggle",
        "Meditation for Beginners",
        "How to fix a leaky faucet",
        "Running for beginners"
    ];

    for (const topic of topics) {
        const prompt = `Create a plan for "${topic}".
      Return a JSON array with one object:
      { "videoUrl": "A VALID, REAL YouTube video URL (e.g. https://www.youtube.com/watch?v=...)" }
      DO NOT HALLUCINATE. If unknown, use search queries. BUT prioritize real video links if you are 99% sure.`;

        console.log(`\nTopic: ${topic}`);
        try {
            const result = await model.generateContent(prompt);
            // Handle potential JSON inside text block
            let text = result.response.text();
            if (text.startsWith('```json')) {
                text = text.replace(/```json\n|\n```/g, '');
            }
            const parsed = JSON.parse(text);
            const url = Array.isArray(parsed) ? parsed[0]?.videoUrl : parsed.videoUrl;
            console.log(`AI suggested: ${url}`);

            const check = await checkUrl(url);
            console.log(`Link valid? ${check.valid} (Status: ${check.status})`);
        } catch (error) {
            console.error("Error/Failed:", error.message);
        }
    }
}

testVideoLinks();
