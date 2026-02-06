import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrate() {
    // Dynamic import to ensure process.env.DATABASE_URL is set before db is initialized
    const { default: pool } = await import('../src/lib/db');

    const client = await pool.connect();
    try {
        console.log('Running migration: Add domain to users table...');

        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS domain TEXT;
        `);

        console.log('Migration successful: domain column added.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
