import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { getUserFromHeader } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { ReactionEnum } from '@/lib/schemas';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const user: any = await getUserFromHeader();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { targetId, targetType, reactionType } = await request.json(); // targetType: 'post' | 'comment'

        if (!targetId || !targetType || !reactionType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const parseResult = ReactionEnum.safeParse(reactionType);
        if (!parseResult.success) {
            return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');
        const collectionName = targetType === 'post' ? 'posts' : 'comments';

        const target = await db.collection(collectionName).findOne({ _id: new ObjectId(targetId) });
        if (!target) {
            return NextResponse.json({ error: 'Target not found' }, { status: 404 });
        }

        const reactions = target.reactions || [];
        const existingReactionIndex = reactions.findIndex((r: any) => r.userId === user.id);

        if (existingReactionIndex > -1) {
            // Update or remove
            if (reactions[existingReactionIndex].type === reactionType) {
                // Remove (toggle off)
                reactions.splice(existingReactionIndex, 1);
            } else {
                // Update type
                reactions[existingReactionIndex].type = reactionType;
            }
        } else {
            // Add new
            reactions.push({
                userId: user.id,
                userName: user.name,
                type: reactionType
            });

            // Send Notification
            if (target.authorId !== user.id) {
                const author = await db.collection('users').findOne({ _id: new ObjectId(target.authorId) });
                if (author && author.email) {
                    await sendEmail(
                        author.email,
                        `New Reaction on your ${targetType}`,
                        `Hello ${author.name},\n\n${user.name} reacted with ${reactionType} to your ${targetType}.\n\nCheck it out on the blog!`
                    );
                }
            }
        }

        await db.collection(collectionName).updateOne(
            { _id: new ObjectId(targetId) },
            { $set: { reactions } }
        );

        return NextResponse.json({
            reactions,
            userReaction: reactions.find((r: any) => r.userId === user.id)?.type || null
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to toggle reaction' }, { status: 500 });
    }
}
