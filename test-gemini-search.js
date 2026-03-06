const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testSearchTool() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Try enabling Google Search tool
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash", // Use the name that worked in AiService
        tools: [
            {
                googleSearch: {}, // Enable Google Search
            },
        ],
    });

    const prompt = "Find a specific YouTube video for 'Meditation for Beginners'. Return ONLY the video URL.";

    console.log("Testing Google Search Tool with prompt:", prompt);

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Response:", text);

        // Check meaningful metadata about search usage
        const groundingMetadata = result.response.candidates[0]?.groundingMetadata;
        if (groundingMetadata) {
            console.log("Grounding Metadata used:", JSON.stringify(groundingMetadata, null, 2));
        } else {
            console.log("No grounding metadata found (Search tool might not be active/supported for this model).");
        }

    } catch (error) {
        console.error("Error/Failed:", error.message);
    }
}

testSearchTool();
