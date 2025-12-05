import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const client = await clientPromise;
        const db = client.db('blog_app');

        const user = await db.collection('users').findOne({
            resetToken: hashedToken,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);

        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: { resetToken: "", resetTokenExpiry: "" }
            }
        );

        return NextResponse.json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }
}
