import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { CreateClassSchema, UserStatusEnum } from '@/lib/schemas';
import { hashPassword, getUserFromHeader } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const user = await getUserFromHeader();
        // Strict check: Only super_admin can create classes
        if (!user || (user as any).role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized: Only Super Admins can create classes' }, { status: 403 });
        }

        const body = await request.json();
        const result = CreateClassSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        const { className, classCode, repName, repEmail, repPassword } = result.data;

        const client = await clientPromise;
        const db = client.db('blog_app');

        // 1. Check if Class Code exists
        const existingClass = await db.collection('organizations').findOne({ code: classCode });
        if (existingClass) {
            return NextResponse.json({ error: 'Class code already exists' }, { status: 409 });
        }

        // 2. Check if Rep Email exists
        const existingUser = await db.collection('users').findOne({ email: repEmail });
        if (existingUser) {
            return NextResponse.json({ error: 'Class Rep email already exists' }, { status: 409 });
        }

        // 3. Create Organization
        const newOrg = {
            name: className,
            code: classCode,
            createdAt: new Date(),
        };
        const orgResult = await db.collection('organizations').insertOne(newOrg);
        const organizationId = orgResult.insertedId.toString();

        // 4. Create Class Rep User
        const hashedPassword = await hashPassword(repPassword);
        const newRep = {
            name: repName,
            email: repEmail,
            password: hashedPassword,
            role: 'class_rep',
            organizationId: organizationId,
            status: 'active', // Class Rep is active immediately
            isBlacklisted: false,
            createdAt: new Date(),
        };

        await db.collection('users').insertOne(newRep);

        return NextResponse.json({
            success: true,
            message: 'Class and Class Rep created successfully',
            data: {
                class: { name: className, code: classCode, id: organizationId },
                rep: { email: repEmail, name: repName }
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Create class error:', error);
        return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
    }
}
