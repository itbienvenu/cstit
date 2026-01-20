import { ObjectId } from 'mongodb';
import clientPromise from './db';

export const classMembershipChecker = async (
    userId: string,
    classId: string,
    role?: 'student' | 'class_rep'
): Promise<boolean> => {
    try {
        const client = await clientPromise;
        const db = client.db('blog_app');

        // Validate ObjectId format to prevent errors
        if (!ObjectId.isValid(userId)) {
            return false;
        }

        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

        console.log('ClassMembershipCheck Debug:', {
            inputUserId: userId,
            inputClassId: classId,
            inputRole: role,
            foundUser: user ? { id: user._id, role: user.role, orgId: user.organizationId } : 'Not Found'
        });

        if (!user) {
            return false;
        }

        // Super Admin bypass
        if (user.role === 'super_admin') {
            return true;
        }

        // Check if user belongs to the class (organization)
        if (user.organizationId !== classId) {
            console.log(`Mismatch: User Org (${user.organizationId}) != Target Class (${classId})`);
            return false;
        }

        // Check for specific role if required
        if (role && user.role !== role) {
            console.log(`Mismatch: User Role (${user.role}) != Required Role (${role})`);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error checking class membership:', error);
        return false;
    }
};
