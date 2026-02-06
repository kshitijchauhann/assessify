import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { name, email, domain } = await request.json();

        const client = await pool.connect();
        try {
            // We'll update the user. Password updates could be handled separately or here if needed, 
            // but for now let's stick to profile info.
            await client.query(
                'UPDATE users SET name = $1, email = $2, domain = $3 WHERE id = $4',
                [name, email, domain, id]
            );
            return NextResponse.json({ success: true, message: 'User updated' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const client = await pool.connect();
        try {
            // Note: If you have foreign keys (assignments, results), you might need CASCADE delete 
            // or delete dependent records first. Assuming standard setup or manual cleanup.
            // Let's try to delete. If it fails due to FK, we'll return error.

            // Delete assignments first (if any)
            await client.query('DELETE FROM assignments WHERE user_id = $1', [id]);
            // Delete results (if any - optional, maybe we want to keep them?)
            // Assuming we want fresh start for deletion:
            await client.query('DELETE FROM results WHERE user_id = $1', [id]);

            await client.query('DELETE FROM users WHERE id = $1', [id]);

            return NextResponse.json({ success: true, message: 'User deleted' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Could not delete user (possibly referenced)' }, { status: 500 });
    }
}
