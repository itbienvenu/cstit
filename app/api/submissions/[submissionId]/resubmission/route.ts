import { NextResponse } from "next/server";
import { getUserFromHeader } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { SubmissionRepository } from "@/engines/DRIVERS/SUBMMITION/submission.repository";
import { SubmissionService } from "@/engines/DRIVERS/SUBMMITION/submission.service";
import { classMembershipChecker } from "@/lib/classMembershipChecker";
import { ObjectId } from "mongodb";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ submissionId: string }> }
) {
    try {
        const { submissionId } = await params;
        const user = await getUserFromHeader() as any;

        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { action, reason } = await req.json();

        if (!action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ message: "Invalid action. Must be 'approve' or 'reject'" }, { status: 400 });
        }

        const db = await getDb();
        const repository = new SubmissionRepository(db);
        const service = new SubmissionService(repository);

        // Zero Trust: Verify user is a Class Rep for the assignment's class
        const submissionDoc = await repository.findById(submissionId);
        if (!submissionDoc) {
            return NextResponse.json({ message: "Submission not found" }, { status: 404 });
        }

        const assignmentsCollection = db.collection("assignments") as any;
        const assignment = await assignmentsCollection.findOne({ _id: new ObjectId(submissionDoc.assignmentId) });

        if (!assignment) {
            return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
        }

        const isRep = await classMembershipChecker(user.id, assignment.classId, 'class_rep');
        if (!isRep) {
            return NextResponse.json({ message: "Access denied: Only Class Reps can manage resubmissions" }, { status: 403 });
        }

        let submission;
        if (action === 'approve') {
            submission = await service.approveResubmission(submissionId, user.id);
        } else {
            submission = await service.rejectResubmission(submissionId, reason);
        }

        return NextResponse.json({
            message: `Resubmission request ${action}d successfully`,
            submission
        }, { status: 200 });

    } catch (err: any) {
        console.error("Resubmission action error:", err);
        const errorMessage = err.message || "An unexpected error occurred";

        if (errorMessage.includes('not found') ||
            errorMessage.includes('No resubmission request')) {
            return NextResponse.json({ message: errorMessage }, { status: 404 });
        }

        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
