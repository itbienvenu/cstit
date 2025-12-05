import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { RegisterSchema } from '@/lib/schemas';
import { hashPassword } from '@/lib/auth';
import { getOrganizationByCode } from '@/lib/cache';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = RegisterSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        const { name, email, password, classCode } = result.data;

        const client = await clientPromise;
        const db = client.db('blog_app');

        // 1. Check if user already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        let organizationId = null;
        let role = 'student'; // Default role
        let status = 'pending'; // Default status for students

        // 2. Validate Class Code if provided (Mandatory for students)
        if (classCode) {
            const org: any = await getOrganizationByCode(classCode);
            if (!org) {
                return NextResponse.json({ error: 'Invalid Class Code' }, { status: 400 });
            }
            organizationId = org._id.toString();
        } else {
            return NextResponse.json({ error: 'Class Code is required' }, { status: 400 });
        }

        // 3. Create User
        const hashedPassword = await hashPassword(password);
        const newUser = {
            name,
            email,
            password: hashedPassword,
            role,
            organizationId,
            status, // 'pending' -> waiting for Class Rep approval
            isBlacklisted: false,
            createdAt: new Date(),
        };

        await db.collection('users').insertOne(newUser);

        return NextResponse.json({
            message: 'Registration successful. Waiting for Class Representative approval.',
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
    }
}
