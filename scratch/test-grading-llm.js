const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function callGroq(prompt) {
    const apiKey = process.env.GROQ_API_KEY;
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
        }),
    });
    if (!res.ok) throw new Error(`Groq HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
}

function extractJson(text) {
    if (!text) return null;
    try {
        const cleaned = text.replace(/^```json\s*/i, '')
                           .replace(/^```\s*/i, '')
                           .replace(/\s*```$/i, '')
                           .trim();
        try {
            return JSON.parse(cleaned);
        } catch {}

        const jsonMatch = cleaned.match(/\{[\s\S]*\}/) || cleaned.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            let jsonString = jsonMatch[0];
            jsonString = jsonString.replace(/[\u0000-\u001F]/g, (match) => {
                if (match === '\n') return '\\n';
                if (match === '\r') return '\\r';
                if (match === '\t') return '\\t';
                return ''; 
            });
            return JSON.parse(jsonString);
        }
        return null;
    } catch (err) {
        return null;
    }
}

async function testGrading() {
    const targetScript = "Bonjour, c'est un test de la commande de l'audio génération.";
    const transcription = "Bonjour, c'est un test de la commande de l'audio génération."; // perfectly matched
    const locale = "fr-FR";

    const prompt = `
    You are an expert language coach. Analyze a student's attempt to say: "${targetScript}" in ${locale}.
    The student actually said (transcribed): "${transcription}".
    
    TASKS:
    1. Compare the student's transcription to the target script.
    2. Evaluate Pronunciation, Pace, and Tone (0-100). Since you only have the text transcription, estimate the Pace and Tone based on natural pauses or word completeness.
    3. Identify specific words that were mispronounced, missed, or added by comparing the target to the transcription.
    
    OUTPUT SCHEMA (Strict JSON):
    {
        "score": number (overall 0-100),
        "metrics": {
            "pronunciation": number,
            "pace": number,
            "tone": number
        },
        "mistakes": [
            { "word": string, "correctionLabel": "Pronunciation"|"Phonetic"|"Missing", "feedback": "Short encouraging tip" }
        ],
        "feedback": "Overall encouraging summary"
    }
    
    Return ONLY the raw JSON.`;

    try {
        console.log('Calling text LLM to grade...');
        const responseText = await callGroq(prompt);
        console.log('RAW RESPONSE:', responseText);
        const parsed = extractJson(responseText);
        console.log('PARSED JSON:', parsed);
    } catch (error) {
        console.error('GRADING FAILED:', error);
    }
}

testGrading();
