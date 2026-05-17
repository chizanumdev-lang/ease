const { Client } = require('pg');

async function searchEmail() {
    const client = new Client({
        host: 'aws-0-eu-west-1.pooler.supabase.com',
        port: 5432,
        user: 'postgres.zfekilefdlkkfhoyjtfy',
        password: 'Ineed20$now.',
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    const email = 'idemili730@gmail.com';

    try {
        await client.connect();
        
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        for (const table of tablesRes.rows) {
            const tableName = table.table_name;
            const columnsRes = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = 'public'
            `, [tableName]);

            for (const column of columnsRes.rows) {
                const colName = column.column_name;
                try {
                    const findRes = await client.query(`
                        SELECT * FROM ${tableName} WHERE CAST(${colName} AS TEXT) ILIKE $1
                    `, [`%${email}%`]);

                    if (findRes.rows.length > 0) {
                        console.log(`Found in table ${tableName}, column ${colName}:`, findRes.rows);
                    }
                } catch (e) {
                    // Ignore errors for non-searchable columns
                }
            }
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

searchEmail();
