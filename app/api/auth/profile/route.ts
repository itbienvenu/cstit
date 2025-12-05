import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { hashPassword, getUserFromHeader } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function PUT(request: Request) {
    try {
        const user = await getUserFromHeader();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, password } = body;

        if (!name && !password) {
            return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');

        const updates: any = {};
        if (name) updates.name = name;
        if (password) {
            if (password.length < 6) {
                return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
            }
            updates.password = await hashPassword(password);
        }

        // Type assertion since we know our JWT structure
        const userId = (user as any).id || (user as any)._id;

        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: updates }
        );

        // Fetch updated user to return clean object
        const updatedUser = await db.collection('users').findOne(
            { _id: new ObjectId(userId) },
            { projection: { password: 0 } }
        );

        return NextResponse.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
