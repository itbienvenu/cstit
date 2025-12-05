import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { getUserFromHeader } from '@/lib/auth';
import { ConversationSchema } from '@/lib/schemas';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
    try {
        const user: any = await getUserFromHeader();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');

        const conversations = await db.collection('conversations')
            .find({ participants: user.id })
            .sort({ lastMessageAt: -1 })
            .toArray();

        // Enhance conversations with other participant's info
        const enhancedConversations = await Promise.all(conversations.map(async (conv) => {
            const otherUserId = conv.participants.find((id: string) => id !== user.id);
            const otherUser = await db.collection('users').findOne(
                { _id: new ObjectId(otherUserId) },
                { projection: { name: 1, email: 1 } }
            );

            return {
                ...conv,
                otherUser: otherUser || { name: 'Unknown User', email: '' },
                unreadCount: conv.unreadCounts?.[user.id] || 0
            };
        }));

        return NextResponse.json(enhancedConversations);
    } catch (error) {
        console.error('Fetch conversations error:', error);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user: any = await getUserFromHeader();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { recipientId } = await request.json();
        if (!recipientId) {
            return NextResponse.json({ error: 'Recipient ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');

        // Check if conversation already exists
        const existingConv = await db.collection('conversations').findOne({
            participants: { $all: [user.id, recipientId] }
        });

        if (existingConv) {
            return NextResponse.json(existingConv);
        }

        // Create new conversation
        const newConvData = {
            participants: [user.id, recipientId],
            lastMessage: '',
            lastMessageAt: new Date(),
            unreadCounts: {
                [user.id]: 0,
                [recipientId]: 0
            }
        };

        const result = ConversationSchema.safeParse(newConvData);
        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        const inserted = await db.collection('conversations').insertOne(result.data);
        return NextResponse.json({ ...result.data, _id: inserted.insertedId }, { status: 201 });

    } catch (error) {
        console.error('Create conversation error:', error);
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }
}
