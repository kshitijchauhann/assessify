import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import { sendEmail } from '@/lib/email';


// Fallback email sender (Log only if no transport available for now, 
// unless SMTP details are provided in env, which currently aren't standardized in this project)
// But user requested "via nodemailer or resend". 
// I will setup a log-only transporter if Resend is missing to simulate sending.

export async function POST(request: Request) {
    try {
        const { name, email, password: providedPassword, role = 'user' } = await request.json();

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
                'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                [name, email, passwordHash, role]
            );

            // Send Email
            const emailText = `
                <h1>Welcome to Assessify, ${name}!</h1>
                <p>Your account has been created successfully.</p>
                <p><strong>Login Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p>Please login at: <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login">Assessify Login</a></p>
            `;

            // Use the new email utility
            const emailResult = await sendEmail(
                email,
                'Assessify Platform Credentials',
                emailText
            );

            if (!emailResult.success) {
                console.warn('Failed to send welcome email:', emailResult.error);
                // We still return success for user creation, but log the email failure
            }

            return NextResponse.json({ success: true, message: 'User created' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('User creation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
