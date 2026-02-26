import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    try {
        const client = await pool.connect();
        try {
            // Step 1: Get user's domain
            const userResult = await client.query(
                'SELECT domain FROM users WHERE id = $1',
                [userId]
            );
            const userDomain = userResult.rows[0]?.domain;

            // Step 2: Auto-create missing assignments for tests available to this user
            // This covers: tests for the user's own domain + 'common' tests for everyone
            if (userDomain) {
                await client.query(
                    `INSERT INTO assignments (user_id, domain, status)
                     SELECT $1, q.domain, 'pending'
                     FROM (SELECT DISTINCT domain FROM questions WHERE domain = $2 OR domain = 'common') q
                     WHERE NOT EXISTS (
                         SELECT 1 FROM assignments
                         WHERE user_id = $1
                         AND domain = q.domain
                     )`,
                    [userId, userDomain]
                );
            }

            // Step 3: Return all assignments
            const result = await client.query(
                `SELECT * FROM assignments WHERE user_id = $1 ORDER BY assigned_at DESC`,
                [userId]
            );
            return NextResponse.json({ assignments: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Fetch assignments error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
