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
