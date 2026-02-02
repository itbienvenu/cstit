import { NextResponse } from "next/server";
import { getUserFromHeader } from "@/lib/auth";
import { getDb } from "@/lib/db";
import clientPromise from "@/lib/db";
import { SubmissionRepository } from "@/engines/DRIVERS/SUBMMITION/submission.repository";
import { SubmissionService } from "@/engines/DRIVERS/SUBMMITION/submission.service";
import { ObjectId } from "mongodb";

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
        const repository = new SubmissionRepository(db);
        const service = new SubmissionService(repository);

        const pendingRequests = await service.getPendingResubmissionRequests(assignmentId);

        const client = await clientPromise;
        const usersDb = client.db('blog_app'); // Users are in blog_app DB
        const usersCollection = usersDb.collection('users');

        const requestsWithUserInfo = await Promise.all(
            pendingRequests.map(async (request) => {
                const student = await usersCollection.findOne({ _id: new ObjectId(request.studentId) });
                return {
                    ...request,
                    student: {
                        id: student?._id?.toHexString() || '',
                        name: student?.name || 'Unknown',
                        email: student?.email || 'Unknown'
                    }
                };
            })
        );

        return NextResponse.json({
            requests: requestsWithUserInfo,
            total: pendingRequests.length
        }, { status: 200 });

    } catch (err: any) {
        console.error("Get pending resubmission requests error:", err);
        const errorMessage = err.message || "An unexpected error occurred";

        if (errorMessage.includes('No submission found') ||
            errorMessage.includes('already requested resubmission')) {
            return NextResponse.json({ message: errorMessage }, { status: 400 });
        }

        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
