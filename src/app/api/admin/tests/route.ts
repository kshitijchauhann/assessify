import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
        const query = `
            SELECT 
                q.domain, 
                COUNT(q.id) as question_count,
                COALESCE(tc.duration_minutes, 30) as duration
            FROM questions q
            LEFT JOIN test_configs tc ON q.domain = tc.domain
            GROUP BY q.domain, tc.duration_minutes
            ORDER BY q.domain ASC
        `;
        const result = await client.query(query);
        return NextResponse.json({ tests: result.rows });
    } catch (error) {
        console.error('Fetch tests error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
