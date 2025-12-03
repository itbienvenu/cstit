import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { PostSchema } from '@/lib/schemas';
import { getUserFromHeader } from '@/lib/auth';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('blog_app');
        const posts = await db.collection('posts').find({}).sort({ createdAt: -1 }).toArray();
        return NextResponse.json(posts);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user: any = await getUserFromHeader();
        if (!user || (user.role !== 'class_rep' && user.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const result = PostSchema.safeParse({ ...body, authorId: user.id, authorName: user.name });

        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');
        const newPost = await db.collection('posts').insertOne(result.data);

        return NextResponse.json({ ...result.data, _id: newPost.insertedId }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const user: any = await getUserFromHeader();
        if (!user || (user.role !== 'class_rep' && user.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { _id, title, description } = body;

        if (!_id || !title || !description) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');
        const { ObjectId } = require('mongodb');

        const query: any = { _id: new ObjectId(_id) };
        if (user.role !== 'super_admin') {
            query.authorId = user.id;
        }

        const updateResult = await db.collection('posts').updateOne(query, {
            $set: { title, description, updatedAt: new Date() }
        });

        if (updateResult.matchedCount === 0) {
            return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Post updated' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
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
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');
        const { ObjectId } = require('mongodb');

        const query: any = { _id: new ObjectId(id) };
        if (user.role !== 'super_admin') {
            query.authorId = user.id;
        }

        const deleteResult = await db.collection('posts').deleteOne(query);

        if (deleteResult.deletedCount === 0) {
            return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Post deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }
}
