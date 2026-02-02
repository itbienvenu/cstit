import { NextResponse } from "next/server";
import { getUserFromHeader } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { SubmissionRepository } from "@/engines/DRIVERS/SUBMMITION/submission.repository";
import { SubmissionService } from "@/engines/DRIVERS/SUBMMITION/submission.service";
import { classMembershipChecker } from "@/lib/classMembershipChecker";
import { ObjectId } from "mongodb";

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
