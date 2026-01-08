const { Client } = require('pg');

const connectionString = "postgresql://postgres.fwolzfifvemovpsffpuh:XCRTeZ5xeZTCnqnI@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function test() {
    const client = new Client({ connectionString });
    try {
        console.log('Connecting to Supabase pooler...');
        await client.connect();
        console.log('Connected successfully!');
        const res = await client.query('SELECT 1');
        console.log('Query result:', res.rows);
    } catch (err) {
        console.error('Connection error:', err.message);
    } finally {
        await client.end();
    }
}

test();
