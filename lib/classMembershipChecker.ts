import { ObjectId } from 'mongodb';
import clientPromise from './db';

export const classMembershipChecker = async (
    userId: string,
    classId: string,
    role?: 'student' | 'class_rep'
): Promise<boolean> => {
    try {
        const client = await clientPromise;
        const db = client.db();

        // Validate ObjectId format to prevent errors
        if (!ObjectId.isValid(userId)) {
            return false;
        }

        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return false;
        }

        // Check if user belongs to the class (organization)
        if (user.organizationId !== classId) {
            return false;
        }

        // Check for specific role if required
        if (role && user.role !== role) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error checking class membership:', error);
        return false;
    }
};
