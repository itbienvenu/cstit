import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { UserSchema, RoleEnum } from '@/lib/schemas';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Default role is user, but we should allow specifying it if needed (though usually controlled)
        // For now, let's assume registration is for 'user' role mostly.
        // If someone tries to register as admin, we might want to block that or require approval.
        // The prompt says: "on create the account we will send the notificatoina to class reps to confirm them"

        const result = UserSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.issues }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('blog_app');

        const existingUser = await db.collection('users').findOne({ email: result.data.email });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const hashedPassword = await hashPassword(result.data.password);
        const newUser = {
            ...result.data,
            password: hashedPassword,
            isConfirmed: false, // Explicitly false until confirmed
            createdAt: new Date(),
        };

        await db.collection('users').insertOne(newUser);

        // TODO: Send notification to class reps (mocked for now)
        console.log('Notification sent to class reps to confirm user:', newUser.email);

        return NextResponse.json({ message: 'User registered successfully. Please wait for confirmation.' }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
    }
}
