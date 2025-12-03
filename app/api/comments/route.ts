import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { CommentSchema } from '@/lib/schemas';
import { getUserFromHeader } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const postId = searchParams.get('postId');

        if (!postId) {
            return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');
        const comments = await db.collection('comments').find({ postId }).sort({ createdAt: 1 }).toArray();

        return NextResponse.json(comments);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user: any = await getUserFromHeader();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const result = CommentSchema.safeParse({ ...body, authorId: user.id, authorName: user.name });

        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');
        const newComment = await db.collection('comments').insertOne(result.data);

        return NextResponse.json({ ...result.data, _id: newComment.insertedId }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
}
