const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
    const client = new Client({
        host: 'aws-0-eu-west-1.pooler.supabase.com',
        port: 5432,
        user: 'postgres.zfekilefdlkkfhoyjtfy',
        password: 'Ineed20$now.',
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to staging database');

        const jsonPath = path.join(__dirname, '../research/output/task-templates.json');
        if (!fs.existsSync(jsonPath)) {
            throw new Error(`Templates JSON not found at: ${jsonPath}`);
        }

        const shards = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(`Loaded ${shards.length} templates from ${jsonPath}`);

        console.log('🧹 Clearing outdated task_shards from staging...');
        await client.query('DELETE FROM task_shards');

        console.log(`🌱 Seeding ${shards.length} consolidated task templates into staging...`);
        for (const s of shards) {
            const query = `
                INSERT INTO task_shards (
                    name, 
                    display_name, 
                    category, 
                    modality, 
                    intensity, 
                    description, 
                    typical_duration_minutes, 
                    energy_level, 
                    difficulty_base, 
                    metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `;
            
            const values = [
                s.name,
                s.displayName,
                s.category || 'journal',
                s.modality || 'practical',
                s.intensity || 5,
                s.description || '',
                s.typicalDurationMinutes || 10,
                s.energy || 'medium',
                s.difficulty_base || 5,
                JSON.stringify(s.metadata || {})
            ];

            await client.query(query, values);
            console.log(`  Seeded: ${s.name}`);
        }

        const countRes = await client.query('SELECT COUNT(*) FROM task_shards');
        console.log(`🎉 Staging database task_shards seeded successfully! Total rows: ${countRes.rows[0].count}`);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        await client.end();
    }
}

run();
