import { NextResponse } from "next/server";
import { getUserFromHeader } from "@/lib/auth";
import { getDb } from "@/lib/db";
import clientPromise from "@/lib/db";
import { SubmissionRepository } from "@/engines/DRIVERS/SUBMMITION/submission.repository";
import { SubmissionService } from "@/engines/DRIVERS/SUBMMITION/submission.service";
import { ObjectId } from "mongodb";
import { classMembershipChecker } from "@/lib/classMembershipChecker";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        const { assignmentId } = await params;
        const user = await getUserFromHeader() as any;

        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const db = await getDb();

        // Zero Trust: Verify user is a Class Rep for this assignment's class
        const assignmentsCollection = db.collection("assignments") as any;
        const assignment = await assignmentsCollection.findOne({ _id: new ObjectId(assignmentId) });

        if (!assignment) {
            return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
        }

        const isRep = await classMembershipChecker(user.id, assignment.classId, 'class_rep');
        if (!isRep) {
            return NextResponse.json({ message: "Access denied: Only Class Reps can view all submissions" }, { status: 403 });
        }

        const repository = new SubmissionRepository(db);
        const service = new SubmissionService(repository);

        const submissions = await service.getSubmissionsForAssignment(assignmentId);

        const client = await clientPromise;
        const usersDb = client.db('blog_app'); // Users are in blog_app DB
        const usersCollection = usersDb.collection('users');

        const submissionsWithUserInfo = await Promise.all(
            submissions.map(async (submission) => {
                const student = await usersCollection.findOne({ _id: new ObjectId(submission.studentId) });
                return {
                    ...submission,
                    student: {
                        id: student?._id?.toHexString() || '',
                        name: student?.name || 'Unknown',
                        email: student?.email || 'Unknown'
                    }
                };
            })
        );

        return NextResponse.json({
            submissions: submissionsWithUserInfo,
            total: submissions.length
        }, { status: 200 });

    } catch (err: any) {
        console.error("Get submissions error:", err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
