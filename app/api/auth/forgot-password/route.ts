import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { sendEmail, generateResetPasswordEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');

        const user = await db.collection('users').findOne({ email });

        if (!user) {
            // Return success even if user not found to prevent enumeration attacks
            return NextResponse.json({ message: 'If an account exists, an email has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expiry = Date.now() + 3600000; // 1 hour

        await db.collection('users').updateOne(
            { email },
            { $set: { resetToken: hashedToken, resetTokenExpiry: expiry } }
        );

        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        const html = generateResetPasswordEmail(resetLink);

        await sendEmail(email, 'Password Reset Request', 'Reset your password: ' + resetLink, html);

        return NextResponse.json({ message: 'If an account exists, an email has been sent.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
