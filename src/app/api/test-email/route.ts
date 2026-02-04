import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const result = await sendEmail(
            email,
            'Test Email from Assessify',
            '<h1>Hello!</h1><p>This is a test email from your Vercel-compatible Assessify app.</p>'
        );

        if (result.success) {
            return NextResponse.json({ message: 'Email sent successfully' });
        } else {
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in test-email route:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
