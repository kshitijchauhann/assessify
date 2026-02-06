import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        // Now only email is required. Domain is fetched from User.
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // Find user ID and Domain
            const userRes = await client.query('SELECT id, domain FROM users WHERE email = $1', [email]);
            if (userRes.rows.length === 0) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            const { id: userId, domain } = userRes.rows[0];

            if (!domain) {
                return NextResponse.json({ error: 'User has no domain assigned. Please update user profile first.' }, { status: 400 });
            }

            // Assign
            await client.query(
                'INSERT INTO assignments (user_id, domain, status) VALUES ($1, $2, $3)',
                [userId, domain, 'pending']
            );

            return NextResponse.json({ success: true, message: `Test assigned for domain: ${domain}` });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Assignment error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
