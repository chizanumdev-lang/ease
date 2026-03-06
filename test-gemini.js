const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const modelsToTest = [
        "gemini-2.5-flash",
        "gemini-2.0-flash"
    ];

    console.log("Starting model availability test...");

    for (const modelName of modelsToTest) {
        console.log(`\nTesting model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`SUCCESS: ${modelName} responded:`, result.response.text());
            return;
        } catch (error) {
            const errorMsg = error.message ? error.message.split('\n')[0] : String(error);
            console.error(`FAILED: ${modelName} - ${errorMsg}`);
        }
    }
}

testModels();
