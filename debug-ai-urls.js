const { GoogleGenerativeAI } = require("@google/generative-ai");
const https = require('https');
require('dotenv').config();

async function validateYouTubeUrl(url) {
    if (!url || !url.includes('youtube.com/watch')) {
        return { isValid: false, status: 'Invalid Format' };
    }
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    return new Promise((resolve) => {
        https.get(oembedUrl, (res) => {
            resolve({ isValid: res.statusCode === 200, status: res.statusCode });
        }).on('error', () => {
            resolve({ isValid: false, status: 'Error' });
        });
    });
}

async function repairVideoUrl(genAI, theme, title) {
    console.log(`    > Attempting to repair URL for "${theme} - ${title}"...`);
    try {
        const prompt = `Find a VALID, WORKING YouTube video URL for: "${theme} - ${title}".
        Use Google Search to find a real video.
        Return ONLY the URL string. Nothing else.`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            tools: [{ googleSearch: {} }],
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const urlMatch = text.match(/https:\/\/www\.youtube\.com\/watch\?v=[\w-]+/);
        const candidateUrl = urlMatch ? urlMatch[0] : text;

        if (candidateUrl && candidateUrl.includes('youtube.com/watch')) {
            const check = await validateYouTubeUrl(candidateUrl);
            if (check.isValid) {
                console.log(`    > REPAIRED! New URL: ${candidateUrl}`);
                return candidateUrl;
            }
        }
        console.log("    > Repair failed (invalid URL generated).");
        return null;
    } catch (e) {
        console.log("    > Repair error: " + e.message);
        return null;
    }
}

async function testVideoLinks() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        tools: [{ googleSearch: {} }],
    });

    const topics = [
        "Learn to Juggle",
        "Meditation for Beginners"
    ];
    // Reduced topics for speed

    const duration = 3;
    const minutesPerDay = 15;
    const learningStyle = "visual";
    const constraints = [];

    for (const topic of topics) {
        // EXACT PROMPT FROM AiService.ts
        const prompt = `You are an expert curriculum designer. Create a detailed ${duration}-day learning program for the following goal: "${topic}".
    
      Parameters:
      - Daily Commitment: ${minutesPerDay} minutes
      - Learning Style: ${learningStyle}
      - Constraints: ${constraints.join(', ')}
  
      Output Format: JSON array of objects, where each object represents a day.
      
      Each Day Object MUST have:
      - dayNumber: integer
      - theme: string (short theme of the day)
      - videoTask: { 
          title: string, 
          description: string, 
          url: string (CRITICAL: You MUST use the 'googleSearch' tool to find a real YouTube video for this specific title. Search for the topic + theme. Paste the exact URL found. Do NOT guess.) 
        }
      - audioTask: { title: string, description: string, url: string (Use search tool to find a soundcloud or podcast link) }
      - practiceTask: { title: string, description: string }
      - quiz: { title: string, questions: [ { question: string, options: string[], correctAnswer: integer (index) } ] }
  
      IMPORTANT:
      - You have access to Google Search. USE IT.
      - Verify the URL looks like 'https://www.youtube.com/watch?v=...'
      - If you cannot find a video, use the fallback search URL format: "https://www.youtube.com/results?search_query=..."
      
      Return ONLY the JSON array.`;

        console.log(`\nTopic: ${topic}`);
        try {
            const result = await model.generateContent(prompt);
            // Handle potential JSON inside text block
            let text = result.response.text();
            console.log("Raw output size:", text.length);

            if (text.includes('```json')) {
                text = text.replace(/```json\n|\n```/g, '').replace(/```/g, '');
            } else if (text.includes('```')) {
                text = text.replace(/```/g, '');
            }

            const parsed = JSON.parse(text);

            if (!Array.isArray(parsed)) {
                console.log("Output is NOT an array. Structure:", Object.keys(parsed));
                return;
            }

            const day1 = parsed[0];
            const url = day1?.videoTask?.url;
            console.log(`AI suggested: ${url}`);

            if (url && url.includes('youtube.com/watch')) {
                const check = await validateYouTubeUrl(url);
                console.log(`Link valid? ${check.isValid} (Status: ${check.status})`);
                if (!check.isValid) {
                    console.log(`-> Invalid URL. Triggering repair...`);
                    const newUrl = await repairVideoUrl(genAI, day1.theme, day1.videoTask.title);
                    if (newUrl) {
                        console.log(`-> FINAL VALID URL: ${newUrl}`);
                    } else {
                        console.log(`-> Fallback to search: https://www.youtube.com/results?search_query=${encodeURIComponent(day1.theme)}`);
                    }
                }
            } else {
                console.log("Returned Search URL or invalid format.");
            }

        } catch (error) {
            console.error("Error/Failed:", error.message);
        }
    }
}

testVideoLinks();
