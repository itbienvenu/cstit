import { NextResponse } from "next/server";
import { getUserFromHeader } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { SubmissionRepository } from "@/engines/DRIVERS/SUBMMITION/submission.repository";
import { SubmissionService } from "@/engines/DRIVERS/SUBMMITION/submission.service";
import { classMembershipChecker } from "@/lib/classMembershipChecker";
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

        // Zero Trust: Verify user belongs to the assignment's class
        const assignmentsCollection = db.collection("assignments") as any;
        const assignment = await assignmentsCollection.findOne({ _id: new ObjectId(assignmentId) });

        if (!assignment) {
            return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
        }

        const isMember = await classMembershipChecker(user.id, assignment.classId);
        if (!isMember) {
            return NextResponse.json({ message: "Access denied: You are not a member of this class" }, { status: 403 });
        }

        const repository = new SubmissionRepository(db);
        const service = new SubmissionService(repository);

        const submission = await service.getStudentSubmission(user.id, assignmentId);

        if (!submission) {
            return NextResponse.json({
                submitted: false,
                submission: null
            }, { status: 200 });
        }

        return NextResponse.json({
            submitted: true,
            submission: {
                ...submission,
                canResubmit: submission.resubmissionApproved === true,
                hasPendingRequest: submission.resubmissionRequested === true && submission.resubmissionApproved !== true,
                isRejected: submission.resubmissionRejected === true,
                rejectionReason: submission.resubmissionRejectionReason
            }
        }, { status: 200 });

    } catch (err: any) {
        console.error("Get submission status error:", err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
