const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not defined in the environment variables.');
    process.exit(1);
}

const testModels = [
    'meta-llama/llama-3.2-3b-instruct:free',
    'google/gemma-2-9b-it:free',
    'meta-llama/llama-3-8b-instruct:free',
    'meta-llama/llama-3.3-70b-instruct',
    'meta-llama/llama-3.1-8b-instruct'
];

async function testModel(model) {
    console.log(`Testing model: ${model}...`);
    try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://ease.app',
                'X-Title': 'Ease App',
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: 'Say hello in 3 words.' }],
                temperature: 0.7,
            }),
        });

        const text = await res.text();
        if (!res.ok) {
            console.log(`❌ Failed: HTTP ${res.status} - ${text}`);
            return false;
        }

        const data = JSON.parse(text);
        console.log(`✅ Success: "${data.choices[0].message.content.trim()}"`);
        return true;
    } catch (err) {
        console.log(`❌ Error: ${err.message}`);
        return false;
    }
}

async function run() {
    for (const model of testModels) {
        await testModel(model);
        console.log('--------------------------------------------------');
    }
}

run();
