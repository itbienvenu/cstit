import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { PostSchema } from '@/lib/schemas';
import { getUserFromHeader } from '@/lib/auth';
import { sendEmail, generateAnnouncementEmail } from '@/lib/email';
import { withObservability } from '@/engines/Observability/wrapper';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const classCode = searchParams.get('classCode');

        const page = parseInt(searchParams.get('page') || '0');
        const limit = parseInt(searchParams.get('limit') || '0');

        const client = await clientPromise;
        const db = client.db('blog_app');

        const query: any = {};

        if (classCode) {
            // lookup organization by code
            const org = await db.collection('organizations').findOne({ code: classCode });
            if (org) {
                query.organizationId = org._id.toString();
            } else {
                return NextResponse.json([]);
            }
        }

        let cursor = db.collection('posts').find(query).sort({ createdAt: -1 });

        if (page > 0 && limit > 0) {
            const skip = (page - 1) * limit;
            cursor = cursor.skip(skip).limit(limit);
        }

        const posts = await cursor.toArray();
        return NextResponse.json(posts);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

async function createPost(request: NextRequest) {
    try {
        const user: any = await getUserFromHeader();
        if (!user || (user.role !== 'class_rep' && user.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { notifyUserIds } = body;

        const client = await clientPromise;
        const db = client.db('blog_app');
        const { ObjectId } = require('mongodb');

        // Fetch user's organization details to save with post
        let className, classCode;
        if (user.organizationId) {
            const org = await db.collection('organizations').findOne({ _id: new ObjectId(user.organizationId) });
            if (org) {
                className = org.name;
                classCode = org.code;
            }
        }

        const result = PostSchema.safeParse({
            ...body,
            authorId: user.id,
            authorName: user.name,
            organizationId: user.organizationId,
            className,
            classCode
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        const newPost = await db.collection('posts').insertOne(result.data);

        // Handle Email Notifications - Scope to Org
        if (notifyUserIds && Array.isArray(notifyUserIds) && notifyUserIds.length > 0) {
            // Ensure we only notify users in the same org (unless super_admin)
            const query: any = {
                _id: { $in: notifyUserIds.map((id: string) => new ObjectId(id)) }
            };
            if (user.role !== 'super_admin') {
                query.organizationId = user.organizationId;
            }

            const usersToNotify = await db.collection('users').find(query).toArray();

            const emailHtml = generateAnnouncementEmail(result.data.title, result.data.description, user.name);

            // Send emails
            await Promise.all(usersToNotify.map(u =>
                sendEmail(u.email, `📢 Announcement: ${result.data.title}`, result.data.description, emailHtml)
            ));
        }

        return NextResponse.json({ ...result.data, _id: newPost.insertedId }, { status: 201 });
    } catch (error) {
        console.error("Error creating post:", error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}

export const POST = withObservability(createPost, 'CreatePostAPI');

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
