import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cast session.user to any to access custom id/role fields
    const userId = (session.user as any).id;

    try {
        const client = await pool.connect();
        try {
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
