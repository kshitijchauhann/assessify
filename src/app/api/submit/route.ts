import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        const body = await request.json();
        const { domain, answers, candidateName } = body;

        if (!domain || !answers) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const effectiveCandidateName = session?.user?.name || candidateName;
        if (!effectiveCandidateName) {
            return NextResponse.json({ error: 'Unauthorized: You must be logged in to submit a test.' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            // Fetch all questions for this domain from the database
            const questionsResult = await client.query(
                `SELECT question_text, options, correct_answer_index, marks, negative_marks 
                 FROM questions WHERE domain = $1`,
                [domain]
            );

            const allQuestions = questionsResult.rows;

            if (allQuestions.length === 0) {
                return NextResponse.json({ error: 'No questions found for this domain' }, { status: 400 });
            }

            const totalQuestions = allQuestions.length;

            // Calculate Score
            let correct = 0;
            let attempted = 0;

            for (const [questionText, selectedOption] of Object.entries(answers)) {
                if (selectedOption) {
                    attempted++;
                    const questionObj = allQuestions.find((q: any) => q.question_text === questionText);
                    if (questionObj) {
                        const correctOptionIndex = questionObj.correct_answer_index;
                        const options = typeof questionObj.options === 'string'
                            ? JSON.parse(questionObj.options)
                            : questionObj.options;
                        const correctOptionText = String(options[correctOptionIndex]);
                        if (selectedOption === correctOptionText) {
                            correct++;
                        }
                    }
                }
            }

            const percentage = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;

            await client.query('BEGIN');

            // Insert Result
            await client.query(
                `INSERT INTO test_results (candidate_name, domain, score, attempted, total_questions, percentage) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [effectiveCandidateName, domain, correct, attempted, totalQuestions, percentage]
            );

            // Update Assignment Status if User is Logged In
            if (session?.user?.email) {
                await client.query(
                    `UPDATE assignments 
                     SET status = 'completed', score = $1 
                     WHERE user_id = (SELECT id FROM users WHERE email = $2) 
                     AND domain = $3`,
                    [correct, session.user.email, domain]
                );
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        // Return success but DO NOT return the score as per requirements
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Submission error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
