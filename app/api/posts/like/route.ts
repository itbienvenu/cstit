import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { getUserFromHeader } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
    try {
        const user: any = await getUserFromHeader();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { postId } = await request.json();
        if (!postId) {
            return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');

        const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const userId = user.id;
        const likes = post.likes || [];
        const isLiked = likes.includes(userId);

        if (isLiked) {
            // Unlike
            await db.collection('posts').updateOne(
                { _id: new ObjectId(postId) },
                { $pull: { likes: userId } }
            );
        } else {
            // Like
            await db.collection('posts').updateOne(
                { _id: new ObjectId(postId) },
                { $addToSet: { likes: userId } }
            );
        }

        const updatedPost = await db.collection('posts').findOne({ _id: new ObjectId(postId) });

        return NextResponse.json({
            likes: updatedPost?.likes || [],
            isLiked: !isLiked
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
    }
}
