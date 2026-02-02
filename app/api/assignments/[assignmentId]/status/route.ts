import { NextResponse } from "next/server";
import { getUserFromHeader } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { SubmissionRepository } from "@/engines/DRIVERS/SUBMMITION/submission.repository";
import { SubmissionService } from "@/engines/DRIVERS/SUBMMITION/submission.service";

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
