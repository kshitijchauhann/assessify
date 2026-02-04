import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { email, domain } = await request.json(); // Using email to find user for better UX

        if (!email || !domain) {
            return NextResponse.json({ error: 'Email and domain required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // Find user ID
            const userRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
            if (userRes.rows.length === 0) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            const userId = userRes.rows[0].id;

            // Assign
            await client.query(
                'INSERT INTO assignments (user_id, domain, status) VALUES ($1, $2, $3)',
                [userId, domain, 'pending']
            );

            return NextResponse.json({ success: true, message: 'Test assigned successfully' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Assignment error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
