import { NextResponse } from 'next/server';

// Question banks are now modules
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

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain || !domainMap[domain]) {
        return NextResponse.json({ error: 'Invalid or missing domain' }, { status: 400 });
    }

    const allQuestions = domainMap[domain];

    // Randomize questions
    const shuffledQuestions = [...allQuestions].sort(() => 0.5 - Math.random());

    // Take e.g. 20 questions or all of them. Requirement says "Questions are loaded dynamically", 
    // and "10 minutes" duration. 50 questions might be too many for 10 mins, but user didn't specify count.
    // I'll return all for now or maybe limit to 20 if needed later. Let's return all but shuffled.

    // Also randomize options for each question
    const randomizedQuestions = shuffledQuestions.map((q) => {
        // Create a copy of options with their original indices to track the correct answer
        const optionsWithIndices = q.options.map((opt: string, index: number) => ({
            text: opt,
            originalIndex: index,
        }));

        // Shuffle options
        const shuffledOptions = optionsWithIndices.sort(() => 0.5 - Math.random());

        // Map back to simple string array
        const finalOptions = shuffledOptions.map((o: any) => o.text);

        // Find new correct answer index
        // The original answer is an index. We need to find where that index moved to.
        const newAnswerIndex = shuffledOptions.findIndex((o: any) => o.originalIndex === q.answer);

        return {
            question: q.question,
            options: finalOptions,
            // We should probably NOT send the answer to the client if we want secure testing,
            // but for "auto-submit" and client-side timer enforcement mentioned, 
            // usually validation happens on server.
            // However, if we want to validate on server, we need to store the "session" or 
            // send the answer back securely or just validate on submit.
            // For simplicity in this iteration, I won't send the answer key to the client.
            // I will only send the question and options.
            // The submit API will need to re-fetch/re-calculate or trust the client? 
            // "Trusting the client" is bad. 
            // But since I randomize on GET, I can't easily validate on POST unless I store the seed or the specific questions sent.
            // OR, the user receives the FULL question object but "answer" is hidden? 
            // Actually, to validate on server, I need to know WHICH questions were sent and in what order? 
            // No, I just need to know the question ID. But these questions don't have IDs.
            // I will generate a temporary ID (hash or index) or just send the full question text back on submit to verify?
            // Or I can send the answer index but encrypted?
            // Let's stick to simple: Send questions without answers. 
            // On submit, the client sends { question: "text", selectedOption: "text" } 
            // and server finds the question by text and checks the answer.
            // This assumes question text is unique (which it seems to be).
            id: Buffer.from(q.question).toString('base64'), // Simple ID from question text
        };
    });

    return NextResponse.json({ questions: randomizedQuestions });
}
