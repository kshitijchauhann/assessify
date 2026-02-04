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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { domain, answers, candidateName } = body; // answers: { questionText: selectedOptionText }

        if (!domain || !domainMap[domain] || !answers || !candidateName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const allQuestions = domainMap[domain];
        let score = 0;
        const totalQuestions = Object.keys(answers).length; // Or allQuestions.length if we enforce all. 
        // Requirement says "Questions are loaded dynamically". 
        // If we sent ALL questions, we expect answers for ALL or subset.
        // Let's assume we grade what was submitted.

        // Better: We grade based on what the server knows are the questions for this domain.
        // But since we randomized the subset (potentially), we rely on the client sending back the questions?
        // No, client sends { "Question Text": "Option Text" }.

        // We iterate over the *submitted* answers to calculate score. 
        // Any unsubmitted question is 0.

        for (const [questionText, selectedOption] of Object.entries(answers)) {
            const questionObj = allQuestions.find((q) => q.question === questionText);
            if (questionObj) {
                const correctOptionIndex = questionObj.answer;
                const correctOptionText = questionObj.options[correctOptionIndex];

                if (selectedOption === correctOptionText) {
                    score++;
                }
            }
        }

        const percentage = (score / Object.keys(answers).length) * 100;

        // Persist to DB
        const client = await pool.connect();
        try {
            await client.query(
                `INSERT INTO test_results (candidate_name, domain, score, total_questions, percentage) 
         VALUES ($1, $2, $3, $4, $5)`,
                [candidateName, domain, score, Object.keys(answers).length, percentage]
            );
        } finally {
            client.release();
        }

        return NextResponse.json({ success: true, score, total: Object.keys(answers).length, percentage });
    } catch (error) {
        console.error('Submission error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
