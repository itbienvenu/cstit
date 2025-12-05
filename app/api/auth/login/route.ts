import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { LoginSchema } from '@/lib/schemas';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = LoginSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');
        const user = await db.collection('users').findOne({ email: result.data.email });

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isValidPassword = await comparePassword(result.data.password, user.password);
        if (!isValidPassword) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        if (user.status !== 'active') {
            return NextResponse.json({ error: 'Account is pending approval or inactive' }, { status: 403 });
        }

        if (user.isBlacklisted) {
            return NextResponse.json({ error: 'Account is blacklisted' }, { status: 403 });
        }

        // Generate token
        const token = signToken({
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
        });

        return NextResponse.json({
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
                status: user.status
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
    }
}
