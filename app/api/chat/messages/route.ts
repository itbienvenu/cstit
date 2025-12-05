import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { getUserFromHeader } from '@/lib/auth';
import { ChatMessageSchema } from '@/lib/schemas';
import { encrypt, decrypt } from '@/lib/crypto';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
    try {
        const user: any = await getUserFromHeader();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');

        if (!conversationId) {
            return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');

        // Verify user is participant
        const conversation = await db.collection('conversations').findOne({
            _id: new ObjectId(conversationId),
            participants: user.id
        });

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
        }

        const messages = await db.collection('chat_messages')
            .find({ conversationId })
            .sort({ createdAt: 1 })
            .toArray();

        // Decrypt messages
        const decryptedMessages = messages.map(msg => {
            try {
                return {
                    ...msg,
                    content: msg.isDeleted ? 'This message was deleted' : decrypt(msg.content)
                };
            } catch (e) {
                return { ...msg, content: '[Encrypted Message - Failed to Decrypt]' };
            }
        });

        // Filter out messages deleted for this user
        const visibleMessages = decryptedMessages.filter(msg =>
            !(msg as any).deletedFor?.includes(user.id)
        );

        // Mark as read (optional, can be done in a separate call or here)
        // For simplicity, we'll assume fetching them marks them as read for now, 
        // or we can add a specific 'markRead' endpoint. 
        // Let's reset unread count for this user in conversation
        await db.collection('conversations').updateOne(
            { _id: new ObjectId(conversationId) },
            { $set: { [`unreadCounts.${user.id}`]: 0 } }
        );

        return NextResponse.json(visibleMessages);
    } catch (error) {
        console.error('Fetch chat messages error:', error);
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
        const { conversationId, content } = body;

        if (!conversationId || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');

        // Verify conversation exists and user is participant
        const conversation = await db.collection('conversations').findOne({
            _id: new ObjectId(conversationId),
            participants: user.id
        });

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        const encryptedContent = encrypt(content);

        const newMessageData = {
            conversationId,
            senderId: user.id,
            content: encryptedContent,
            createdAt: new Date(),
            readBy: [user.id]
        };

        const result = ChatMessageSchema.safeParse(newMessageData);
        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        const insertedMsg = await db.collection('chat_messages').insertOne(result.data);

        // Update conversation last message and unread counts
        const otherParticipants = conversation.participants.filter((p: string) => p !== user.id);
        const incUpdate: any = {};
        otherParticipants.forEach((p: string) => {
            incUpdate[`unreadCounts.${p}`] = 1;
        });

        await db.collection('conversations').updateOne(
            { _id: new ObjectId(conversationId) },
            {
                $set: {
                    lastMessage: 'Encrypted Message', // Don't store plain text in conversation summary if we want full privacy, or store a snippet if acceptable. 
                    // Let's store "Sent a message" or similar to avoid leaking info, or encrypt this too.
                    // For now, let's just say "New Message"
                    lastMessageAt: new Date()
                },
                $inc: incUpdate
            }
        );

        return NextResponse.json({ ...result.data, _id: insertedMsg.insertedId, content: content }, { status: 201 });

    } catch (error) {
        console.error('Send chat message error:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const user: any = await getUserFromHeader();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { messageId, content, action, deleteType } = body; // action: 'edit' | 'delete'

        const client = await clientPromise;
        const db = client.db('blog_app');

        const message = await db.collection('chat_messages').findOne({ _id: new ObjectId(messageId) });
        if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

        if (message.senderId !== user.id) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        if (action === 'edit') {
            if (message.isDeleted) return NextResponse.json({ error: 'Cannot edit deleted message' }, { status: 400 });
            const encryptedContent = encrypt(content);
            await db.collection('chat_messages').updateOne(
                { _id: new ObjectId(messageId) },
                { $set: { content: encryptedContent, isEdited: true } }
            );
        } else if (action === 'delete') {
            if (deleteType === 'everyone') {
                await db.collection('chat_messages').updateOne(
                    { _id: new ObjectId(messageId) },
                    { $set: { isDeleted: true } }
                );
            } else {
                // Delete for me
                await db.collection('chat_messages').updateOne(
                    { _id: new ObjectId(messageId) },
                    { $addToSet: { deletedFor: user.id } }
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update message error:', error);
        return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }
}
