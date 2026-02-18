
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Creating questions table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_answer_index INTEGER NOT NULL,
        domain TEXT NOT NULL,
        marks INTEGER DEFAULT 1,
        negative_marks FLOAT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Questions table created successfully.');
    } catch (err) {
        console.error('Error creating questions table:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
