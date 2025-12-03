import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { getUserFromHeader } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET() {
    try {
        const user: any = await getUserFromHeader();
        if (!user || (user.role !== 'class_rep' && user.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');
        const users = await db.collection('users').find({}).toArray();

        // Don't return passwords
        const safeUsers = users.map(({ password, ...u }) => u);

        return NextResponse.json(safeUsers);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const user: any = await getUserFromHeader();
        if (!user || (user.role !== 'class_rep' && user.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { _id, ...updates } = body;

        if (!_id) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');


        await db.collection('users').updateOne(
            { _id: new ObjectId(_id) },
            { $set: updates }
        );

        return NextResponse.json({ message: 'User updated' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const user: any = await getUserFromHeader();
        if (!user || (user.role !== 'class_rep' && user.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');
        await db.collection('users').deleteOne({ _id: new ObjectId(id) });

        return NextResponse.json({ message: 'User deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
