
import { Pool } from 'pg';
import dotenv from 'dotenv';
// @ts-ignore
import { questions as baQuestions } from '../questions/baquestionbank';
// @ts-ignore
import { questions as deQuestions } from '../questions/dequestionbank';
// @ts-ignore
import { questions as devopsQuestions } from '../questions/devopsquestionbank';
// @ts-ignore
import { questions as mernQuestions } from '../questions/mernquestionbank';
// @ts-ignore
import { questions as qaQuestions } from '../questions/qaquestionbank';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const domainMap: { [key: string]: any[] } = {
    'business-analytics': baQuestions,
    'data-engineering': deQuestions,
    'devops': devopsQuestions,
    'mern-stack': mernQuestions,
    'quality-assurance': qaQuestions,
};

async function seed() {
    const client = await pool.connect();
    try {
        console.log('Seeding questions...');

        // Optional: Clear existing questions? 
        // await client.query('DELETE FROM questions');

        for (const [domain, questions] of Object.entries(domainMap)) {
            console.log(`Seeding ${domain} with ${questions.length} questions...`);
            for (const q of questions) {
                await client.query(
                    `INSERT INTO questions (question_text, options, correct_answer_index, domain, marks, negative_marks) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                    [q.question, JSON.stringify(q.options), q.answer, domain, 1, 0] // Default 1 mark, 0 neg
                );
            }
        }
        console.log('Seeding completed successfully.');
    } catch (err) {
        console.error('Error seeding questions:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
