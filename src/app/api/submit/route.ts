import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { questions as baQuestions } from '@/../questions/baquestionbank';
import { questions as deQuestions } from '@/../questions/dequestionbank';
import { questions as devopsQuestions } from '@/../questions/devopsquestionbank';
import { questions as mernQuestions } from '@/../questions/mernquestionbank';
import { questions as qaQuestions } from '@/../questions/qaquestionbank';

const domainMap: { [key: string]: any[] } = {
    'business-analytics': baQuestions,
    'data-engineering': deQuestions,
    'devops': devopsQuestions,
    'mern-stack': mernQuestions,
    'quality-assurance': qaQuestions,
};

import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        // We allow anonymous submissions if no session? Or strictly require login?
        // Requirement implies users are logged in ("user dashboard").
        // But the previous code allowed arbitrary candidateName.
        // Let's support both but prioritize session user.

        const body = await request.json();
        const { domain, answers, candidateName } = body;

        if (!domain || !domainMap[domain] || !answers) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const effectiveCandidateName = session?.user?.name || candidateName;
        if (!effectiveCandidateName) {
            return NextResponse.json({ error: 'Candidate name required' }, { status: 400 });
        }

        const allQuestions = domainMap[domain];
        const totalQuestions = allQuestions.length;

        // Calculate Score
        let correct = 0;
        let attempted = 0;

        for (const [questionText, selectedOption] of Object.entries(answers)) {
            if (selectedOption) {
                attempted++;
                const questionObj = allQuestions.find((q) => q.question === questionText);
                if (questionObj) {
                    const correctOptionIndex = questionObj.answer;
                    const correctOptionText = questionObj.options[correctOptionIndex];
                    if (selectedOption === correctOptionText) {
                        correct++;
                    }
                }
            }
        }

        const percentage = (correct / totalQuestions) * 100;

        const client = await pool.connect();
        try {
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
