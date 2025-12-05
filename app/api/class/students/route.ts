import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { getUserFromHeader, hashPassword } from '@/lib/auth';
import { UserStatusEnum } from '@/lib/schemas';
import { ObjectId } from 'mongodb';

export async function GET(request: Request) {
    try {
        const user: any = await getUserFromHeader();
        if (!user || user.role !== 'class_rep') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');

        // Fetch students in the same organization
        const students = await db.collection('users')
            .find({
                organizationId: user.organizationId,
                role: 'student'
            })
            .project({ password: 0 }) // Exclude sensitive data
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json(students);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    // Class Rep creating a student manually (bypassing approval)
    try {
        const user: any = await getUserFromHeader();
        if (!user || user.role !== 'class_rep') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        if (!body.email || !body.password || !body.name) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');

        const existingUser = await db.collection('users').findOne({ email: body.email });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const hashedPassword = await hashPassword(body.password);
        const newStudent = {
            name: body.name,
            email: body.email,
            password: hashedPassword,
            role: 'student',
            organizationId: user.organizationId,
            status: 'active', // Manually created students are active immediately
            isBlacklisted: false,
            createdAt: new Date(),
        };

        await db.collection('users').insertOne(newStudent);

        return NextResponse.json({ message: 'Student created successfully' }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    // Approve or Reject student
    try {
        const user: any = await getUserFromHeader();
        if (!user || user.role !== 'class_rep') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { studentId, status } = body;

        const parseResult = UserStatusEnum.safeParse(status);
        if (!studentId || !parseResult.success) {
            return NextResponse.json({ error: 'Invalid ID or Status' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');

        // Ensure student belongs to my org
        const result = await db.collection('users').updateOne(
            {
                _id: new ObjectId(studentId),
                organizationId: user.organizationId
            },
            { $set: { status: status } }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json({ error: 'Student not found or no change' }, { status: 404 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
    }
}
