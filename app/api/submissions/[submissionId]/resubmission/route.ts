import { NextResponse } from "next/server";
import { getUserFromHeader } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { SubmissionRepository } from "@/engines/DRIVERS/SUBMMITION/submission.repository";
import { SubmissionService } from "@/engines/DRIVERS/SUBMMITION/submission.service";

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

        const { action } = await req.json();

        if (!action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ message: "Invalid action. Must be 'approve' or 'reject'" }, { status: 400 });
        }

        const db = await getDb();
        const repository = new SubmissionRepository(db);
        const service = new SubmissionService(repository);

        let submission;
        if (action === 'approve') {
            submission = await service.approveResubmission(submissionId, user.id);
        } else {
            submission = await service.rejectResubmission(submissionId);
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
