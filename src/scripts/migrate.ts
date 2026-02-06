import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting migration...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'admin' or 'user'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        domain VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed'
        score INTEGER,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS test_results (
        id SERIAL PRIMARY KEY,
        candidate_name VARCHAR(255) NOT NULL,
        domain VARCHAR(50) NOT NULL,
        score INTEGER NOT NULL,
        attempted INTEGER, -- Track attempted questions
        total_questions INTEGER NOT NULL,
        percentage DECIMAL(5, 2) NOT NULL,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        -- Optionally link to users table later, but keeping independent for now or could add user_id Foreign Key
      );
    `);

    // Add column if it doesn't exist (using a safe approach for postgres)
    await client.query(`
            DO $$ 
            BEGIN 
                BEGIN
                    ALTER TABLE test_results ADD COLUMN attempted INTEGER;
                EXCEPTION
                    WHEN duplicate_column THEN RAISE NOTICE 'column attempted already exists in test_results.';
                END;
            END $$;
        `);

    console.log('Migration completed successfully: Tables created.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
