import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';

// GET: List all users
export async function GET() {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT id, name, email, role, domain FROM users ORDER BY id DESC');
            return NextResponse.json({ users: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Fetch users error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create new user
export async function POST(request: Request) {
    try {
        const { name, email, password: providedPassword, domain, role = 'user' } = await request.json();

        if (!name || !email) {
            return NextResponse.json({ error: 'Name and email required' }, { status: 400 });
        }

        // Use provided password or auto-generate
        const password = providedPassword || Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(password, 10);

        const client = await pool.connect();
        try {
            // Check existing
            const existing = await client.query('SELECT * FROM users WHERE email = $1', [email]);
            if (existing.rows.length > 0) {
                return NextResponse.json({ error: 'User already exists' }, { status: 400 });
            }

            await client.query(
                'INSERT INTO users (name, email, password_hash, role, domain) VALUES ($1, $2, $3, $4, $5)',
                [name, email, passwordHash, role, domain]
            );

            return NextResponse.json({ success: true, message: 'User created' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('User creation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
