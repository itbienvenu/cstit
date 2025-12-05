import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { CreateClassSchema, UserStatusEnum } from '@/lib/schemas';
import { hashPassword, getUserFromHeader } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const user = await getUserFromHeader();
        if (!user || (user as any).role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');
        const orgs = await db.collection('organizations').find({}).toArray();

        // Optional: Count members in each org
        const orgsWithCounts = await Promise.all(orgs.map(async (org) => {
            const count = await db.collection('users').countDocuments({ organizationId: org._id.toString() });
            return { ...org, memberCount: count };
        }));

        return NextResponse.json(orgsWithCounts);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    // ... existing POST logic ...
    try {
        const user = await getUserFromHeader();
        if (!user || (user as any).role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const result = CreateClassSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        const { className, classCode, repName, repEmail, repPassword } = result.data;

        const client = await clientPromise;
        const db = client.db('blog_app');

        const existingClass = await db.collection('organizations').findOne({ code: classCode });
        if (existingClass) {
            return NextResponse.json({ error: 'Class code already exists' }, { status: 409 });
        }

        const existingUser = await db.collection('users').findOne({ email: repEmail });
        if (existingUser) {
            return NextResponse.json({ error: 'Class Rep email already exists' }, { status: 409 });
        }

        const newOrg = {
            name: className,
            code: classCode,
            createdAt: new Date(),
        };
        const orgResult = await db.collection('organizations').insertOne(newOrg);
        const organizationId = orgResult.insertedId.toString();

        const hashedPassword = await hashPassword(repPassword);
        const newRep = {
            name: repName,
            email: repEmail,
            password: hashedPassword,
            role: 'class_rep',
            organizationId: organizationId,
            status: 'active',
            isBlacklisted: false,
            createdAt: new Date(),
        };

        await db.collection('users').insertOne(newRep);

        return NextResponse.json({
            success: true,
            message: 'Class created',
            data: { class: { name: className, code: classCode, id: organizationId } }
        }, { status: 201 });

    } catch (error) {
        console.error('Create class error:', error);
        return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const user = await getUserFromHeader();
        if (!user || (user as any).role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { _id, name, code } = body;
        const { ObjectId } = require('mongodb');

        const client = await clientPromise;
        const db = client.db('blog_app');

        await db.collection('organizations').updateOne(
            { _id: new ObjectId(_id) },
            { $set: { name, code } }
        );

        return NextResponse.json({ message: 'Updated' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getUserFromHeader();
        if (!user || (user as any).role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const { ObjectId } = require('mongodb');

        const client = await clientPromise;
        const db = client.db('blog_app');

        // Check if has members?
        // For now, let's allow delete but maybe warn. Or cascade delete users? 
        // Dangerous to cascade delete blindly. Let's just delete the org document for now
        // The users would be orphaned or effectively disabled.

        await db.collection('organizations').deleteOne({ _id: new ObjectId(id) });

        // Also could delete users?
        // await db.collection('users').deleteMany({ organizationId: id });

        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
