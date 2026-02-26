import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
        return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        // Fetch questions for the domain
        // We can limit or randomize here. The previous logic randomized.
        // Postgres has ORDER BY RANDOM()
        const query = `
            SELECT id, question_text as question, options, correct_answer_index as answer, marks, negative_marks 
            FROM questions 
            WHERE domain = $1 
            ORDER BY RANDOM() 
            LIMIT 25
        `;
        const result = await client.query(query, [domain]);

        // Fetch duration
        const durationRes = await client.query('SELECT duration_minutes FROM test_configs WHERE domain = $1', [domain]);
        const duration = durationRes.rows.length > 0 ? durationRes.rows[0].duration_minutes : 30;

        const questions = result.rows.map((q: any) => ({
            id: q.id,
            question: q.question,
            options: q.options, // It's already JSONB, so pg returns object/array
            answer: q.answer, // sending answer index for now as per previous logic
            marks: q.marks,
            negative_marks: q.negative_marks
        }));

        // Randomize options logic from before (optional but good for anti-cheating)
        const randomizedQuestions = questions.map((q: any) => {
            const optionsWithIndices = q.options.map((opt: any, index: number) => ({
                text: String(opt),
                originalIndex: index,
            }));
            const shuffledOptions = optionsWithIndices.sort(() => 0.5 - Math.random());
            const finalOptions = shuffledOptions.map((o: any) => o.text);
            const newAnswerIndex = shuffledOptions.findIndex((o: any) => o.originalIndex === q.answer);

            return {
                id: q.id, // Keep DB ID
                question: q.question,
                options: finalOptions,
                marks: q.marks,
                negative_marks: q.negative_marks,
                // We are NOT sending the answer back in this response for security?
                // The previous code DID send it implicitly via finding new index but the return object in previous code 
                // in my view_file output (Step 77) loop returned:
                // { question, options, id: base64(text) }
                // It did NOT return 'answer'.
                // So I should NOT return answer.
            };
        });

        return NextResponse.json({
            questions: randomizedQuestions,
            duration: duration
        });

    } catch (error: any) {
        console.error('Error fetching questions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
