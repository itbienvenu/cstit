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

export async function PUT(request: Request) {
    try {
        const user: any = await getUserFromHeader();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { commentId, content } = await request.json();
        if (!commentId || !content) {
            return NextResponse.json({ error: 'Comment ID and content required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');

        const comment = await db.collection('comments').findOne({ _id: new ObjectId(commentId) });
        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

        if (comment.authorId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await db.collection('comments').updateOne(
            { _id: new ObjectId(commentId) },
            { $set: { content } }
        );

        return NextResponse.json({ message: 'Comment updated' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const user: any = await getUserFromHeader();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const commentId = searchParams.get('commentId');

        if (!commentId) {
            return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');

        const comment = await db.collection('comments').findOne({ _id: new ObjectId(commentId) });
        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

        // Allow author or super_admin to delete
        if (comment.authorId !== user.id && user.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await db.collection('comments').deleteOne({ _id: new ObjectId(commentId) });

        return NextResponse.json({ message: 'Comment deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }
}
