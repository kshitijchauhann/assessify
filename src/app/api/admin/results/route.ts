import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM test_results ORDER BY submitted_at DESC');
            return NextResponse.json({ results: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Admin API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
