
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import pool from "@/lib/db";
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const domain = formData.get('domain') as string;
        const marks = parseInt(formData.get('marks') as string);
        const negativeMarking = formData.get('negativeMarking') === 'true';
        const negativeMarks = negativeMarking ? parseFloat(formData.get('negativeMarks') as string) : 0;
        const assignToAll = formData.get('assignToAll') === 'true';
        const assignToAllDomains = formData.get('assignToAllDomains') === 'true';
        const duration = parseInt(formData.get('duration') as string) || 30;

        if (!file || !domain || isNaN(marks)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        if (data.length === 0) {
            return NextResponse.json({ error: 'Excel file is empty or invalid format' }, { status: 400 });
        }

        // Validate format based on first row
        const firstRow = data[0] as any;
        if (!firstRow.Question || !firstRow.Option1 || !firstRow.Option2 || !firstRow.Option3 || !firstRow.Option4 || firstRow.CorrectAnswerIndex === undefined) {
            return NextResponse.json({ error: 'Invalid Excel format. Headers must be: Question, Option1, Option2, Option3, Option4, CorrectAnswerIndex' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const row of data as any[]) {
                if (!row.Question) continue; // Skip empty rows

                const options = [row.Option1, row.Option2, row.Option3, row.Option4];
                const correctAnswerIndex = parseInt(row.CorrectAnswerIndex);

                // Basic validation for row data
                if (options.some(opt => opt === undefined || opt === null) || isNaN(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex > 3) {
                    // Can either skip or error. For bulk upload, maybe erroring is safer to ensure data integrity
                    throw new Error(`Invalid data for question: "${row.Question}". Check options and correct answer index.`);
                }

                await client.query(
                    `INSERT INTO questions (question_text, options, correct_answer_index, domain, marks, negative_marks) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [row.Question, JSON.stringify(options), correctAnswerIndex, domain, marks, negativeMarks]
                );
            }

            await client.query('COMMIT');

            // Bulk assignment logic
            if (assignToAll) {
                // We need to release the previous client or start a new transaction? 
                // Actually we committed above, so we can start new transaction or just run queries.
                // Re-using client for assignment
                // We want to assign this test to ALL users who:
                // 1. Have this domain
                // 2. Do NOT already have a 'pending' or 'completed' assignment for this domain?
                // The requirement says "Assign to all". 
                // Let's Insert into assignments if not exists.

                // Note: The questions are uploaded to the bank. The Assignment is just a record in 'assignments' table 
                // linking user_id and domain. The test generation happens at runtime (GET /api/questions).

                // It's safer to do this in a separate try/catch or just log if it fails, 
                // but since user checked it, we should probably try hard.

                try {
                    await client.query('BEGIN');
                    const assignmentQuery = `
                        INSERT INTO assignments (user_id, domain, status)
                        SELECT id, $1, 'pending'
                        FROM users
                        WHERE domain = $1
                        AND NOT EXISTS (
                            SELECT 1 FROM assignments 
                            WHERE user_id = users.id 
                            AND domain = $1
                            AND (status = 'pending' OR status = 'completed')
                        )
                     `;
                    const assignResult = await client.query(assignmentQuery, [domain]);
                    await client.query('COMMIT');
                    console.log(`Auto-assigned test to ${assignResult.rowCount} users in domain ${domain}`);
                } catch (assignErr) {
                    await client.query('ROLLBACK');
                    console.error('Auto-assignment failed:', assignErr);
                    // We don't fail the whole upload if assignment fails, but we could return a warning.
                }
            }

            return NextResponse.json({ message: `Successfully uploaded ${data.length} questions` });

        } catch (dbError: any) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'Database error: ' + dbError.message }, { status: 500 });
        } finally {
            client.release();
        }

    } catch (error: any) {
        return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 });
    }
}
