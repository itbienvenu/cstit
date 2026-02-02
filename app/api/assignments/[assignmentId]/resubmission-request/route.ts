import { NextResponse } from "next/server";
import { getUserFromHeader } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { SubmissionRepository } from "@/engines/DRIVERS/SUBMMITION/submission.repository";
import { SubmissionService } from "@/engines/DRIVERS/SUBMMITION/submission.service";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        const { assignmentId } = await params;
        const user = await getUserFromHeader() as any;

        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { reason } = await req.json();

        if (!reason || reason.trim().length === 0) {
            return NextResponse.json({ message: "Reason is required" }, { status: 400 });
        }

        const db = await getDb();
        const repository = new SubmissionRepository(db);
        const service = new SubmissionService(repository);

        const submission = await service.requestResubmission(user.id, assignmentId, reason);

        return NextResponse.json({
            message: "Resubmission request sent successfully",
            submission
        }, { status: 200 });

    } catch (err: any) {
        console.error("Resubmission request error:", err);
        const errorMessage = err.message || "An unexpected error occurred";

        if (errorMessage.includes('No submission found') ||
            errorMessage.includes('already requested resubmission')) {
            return NextResponse.json({ message: errorMessage }, { status: 400 });
        }

        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
