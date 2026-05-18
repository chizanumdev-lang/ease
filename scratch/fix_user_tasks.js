const { Client } = require('pg');

const SHARD_TO_MOBILE_TYPE = {
    'Awareness': 'video',
    'Cognitive Lab': 'quiz',
    'Deep Practice': 'audio',
    'Reflective Journal': 'journal',
    'Check-in': 'consistency',
    'quick-quiz': 'quiz',
    'binaural-session': 'audio',
    'commitment-check': 'consistency',
    'spaced-recall-quiz': 'quiz',
    'journal-entry': 'journal',
};

function detectType(shardName, modality) {
    const name = shardName.toLowerCase();
    const mod = (modality || '').toLowerCase();
    
    if (name.includes('vocal') || name.includes('speak') || name.includes('pronunciation') || name.includes('conversation')) return 'quiz';
    if (name.includes('recall') || name.includes('kanji') || name.includes('flashcard')) return 'quiz';
    if (mod.includes('watch') || mod.includes('video') || mod.includes('visual')) return 'video';
    if (mod.includes('write') || mod.includes('journal') || mod.includes('writing')) return 'journal';
    if (mod.includes('listen') || mod.includes('audio') || mod.includes('auditory')) return 'audio';
    if (mod.includes('reflect')) return 'reflection';
    if (mod.includes('quiz') || mod.includes('test') || mod.includes('cognitive')) return 'quiz';
    if (mod.includes('commitment') || mod.includes('social')) return 'consistency';
    
    return SHARD_TO_MOBILE_TYPE[shardName] || 'video';
}

async function fixUserTasks() {
    const client = new Client({
        connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
    });

    try {
        await client.connect();
        const programId = 'ad658db0-7468-41f5-9127-8d8e51d1dc0f';
        
        const tasksRes = await client.query(`
            SELECT t.id, t.type, t.title, t.metadata, s.name as shard_name, s.modality
            FROM tasks t 
            LEFT JOIN task_shards s ON (t.metadata->>'shardId')::uuid = s.id
            JOIN day_plans dp ON t.day_plan_id = dp.id 
            WHERE dp.program_id = $1
        `, [programId]);

        for (const task of tasksRes.rows) {
            const newType = detectType(task.shard_name, task.modality);
            if (newType !== task.type) {
                console.log(`Fixing task ${task.id} (${task.title}): ${task.type} -> ${newType}`);
                await client.query('UPDATE tasks SET type = $1 WHERE id = $2', [newType, task.id]);
            }
        }
        console.log('Finished fixing tasks.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

fixUserTasks();
