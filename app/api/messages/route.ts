import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { MessageSchema } from '@/lib/schemas';
import { getUserFromHeader } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/crypto';

import { ObjectId } from 'mongodb';
import { sendEmail, generatePrivateMessageEmail } from '@/lib/email';

export async function GET(request: Request) {
    try {
        const user: any = await getUserFromHeader();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'sent' or 'received'

        const client = await clientPromise;
        const db = client.db('blog_app');

        let query: any = {};
        if (type === 'sent') {
            query.senderId = user.id;
        } else {
            // Default to received messages
            query.recipientId = user.id;
        }

        const messages = await db.collection('messages').find(query).sort({ createdAt: -1 }).toArray();

        // Decrypt content
        const decryptedMessages = messages.map(msg => {
            try {
                return {
                    ...msg,
                    content: decrypt(msg.content)
                };
            } catch (e) {
                return { ...msg, content: '[Encrypted Message - Failed to Decrypt]' };
            }
        });

        return NextResponse.json(decryptedMessages);
    } catch (error) {
        console.error('Fetch messages error:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user: any = await getUserFromHeader();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { postId, content } = body;

        if (!postId || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');

        // Fetch post to get author
        const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Encrypt content
        const encryptedContent = encrypt(content);

        const messageData = {
            content: encryptedContent,
            senderId: user.id,
            senderName: user.name,
            recipientId: post.authorId,
            postId: postId,
            postTitle: post.title,
            createdAt: new Date(),
            isRead: false,
        };

        const result = MessageSchema.safeParse(messageData);

        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        const newMessage = await db.collection('messages').insertOne(result.data);



        // Fetch recipient email and send notification
        const recipient = await db.collection('users').findOne({ _id: new ObjectId(post.authorId) });
        if (recipient && recipient.email) {
            const emailHtml = generatePrivateMessageEmail(user.name, post.title, content);
            await sendEmail(recipient.email, `New Private Message: ${post.title}`, `You have a new private message from ${user.name}`, emailHtml);
        }

        return NextResponse.json({ ...result.data, _id: newMessage.insertedId }, { status: 201 });
    } catch (error) {
        console.error('Create message error:', error);
        return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }
}
