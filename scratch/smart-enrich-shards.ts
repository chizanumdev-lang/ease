import * as fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const shards = JSON.parse(fs.readFileSync('research/output/task-shards.json', 'utf8'));

function getCategoryHeuristic(shard: any): string | null {
    const name = shard.name.toLowerCase();
    const modality = shard.modality.toLowerCase();
    
    if (name.includes('watch') || name.includes('tutorial') || name.includes('video') || name.includes('lecture') || modality === 'watching' || modality === 'visual') {
        return 'video';
    }
    if (name.includes('audio') || name.includes('listen') || name.includes('binaural') || name.includes('sound') || name.includes('meditation') || modality === 'listening') {
        return 'audio';
    }
    if (name.includes('quiz') || name.includes('test') || name.includes('check') || name.includes('assessment') || modality === 'spaced-recall-quiz') {
        return 'quiz';
    }
    if (name.includes('commit') || name.includes('promise') || name.includes('streak') || name.includes('consistency') || name.includes('check-in')) {
        return 'consistency';
    }
    if (modality === 'reflective' || modality === 'writing' || name.includes('journal') || name.includes('reflect') || name.includes('write')) {
        return 'journal';
    }
    return null;
}

async function categorizeWithAI(batch: any[]) {
    const prompt = `
      Categorize these tasks into: video, audio, quiz, journal, consistency.
      Assign intensity (1-10) and 3 tags.
      
      SHARDS:
      ${batch.map(s => `${s.name}: ${s.description}`).join('\n')}
      
      Return JSON: [{"name": "...", "category": "...", "intensity": 5, "tags": ["...", "..."]}]
    `;
    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e: any) {
        console.error('AI Batch failed:', e.message || e);
        return [];
    }
}

async function run() {
    const results: any[] = [];
    const ambiguous: any[] = [];

    for (const s of shards) {
        const cat = getCategoryHeuristic(s);
        if (cat) {
            // Intensity mapping
            let intensity = 5;
            if (s.energy === 'low') intensity = 3;
            if (s.energy === 'high') intensity = 8;
            if (s.difficulty_base > 7) intensity += 2;
            if (s.difficulty_base < 3) intensity -= 2;

            results.push({
                ...s,
                category: cat,
                intensity: Math.max(1, Math.min(10, intensity)),
                tags: [s.modality, s.energy].filter(Boolean)
            });
        } else {
            ambiguous.push(s);
        }
    }

    console.log(`Heuristics categorized ${results.length} shards. ${ambiguous.length} remaining for AI.`);

    const batchSize = 30;
    for (let i = 0; i < ambiguous.length; i += batchSize) {
        console.log(`Processing AI batch ${Math.floor(i/batchSize)+1}...`);
        const batch = ambiguous.slice(i, i + batchSize);
        const aiResults = await categorizeWithAI(batch);
        
        for (const s of batch) {
            const ai = aiResults.find((a: any) => a.name === s.name);
            results.push({
                ...s,
                category: ai?.category || 'journal',
                intensity: ai?.intensity || 5,
                tags: ai?.tags || []
            });
        }
        await new Promise(r => setTimeout(r, 10000)); // 10s between AI calls
    }

    fs.writeFileSync('research/output/task-shards-enriched.json', JSON.stringify(results, null, 2));
    console.log('Done!');
}

run();
