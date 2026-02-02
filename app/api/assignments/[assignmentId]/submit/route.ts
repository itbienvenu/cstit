import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getUserFromHeader } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { SubmissionRepository } from "@/engines/DRIVERS/SUBMMITION/submission.repository";
import { SubmissionService } from "@/engines/DRIVERS/SUBMMITION/submission.service";
import { GoogleDriveService } from "@/lib/drive";
import { Readable } from "stream";

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

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
        }

        const db = await getDb();
        const repository = new SubmissionRepository(db);
        const service = new SubmissionService(repository);

        // Check assignment deadline
        const assignmentsCollection = db.collection("assignments") as any;
        const assignmentDoc = await assignmentsCollection.findOne({
            _id: new ObjectId(assignmentId),
            deletedAt: { $exists: false }
        });

        if (!assignmentDoc) {
            return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
        }

        const deadline = new Date(assignmentDoc.deadlineAt);
        const now = new Date();
        const existingSubmission = await service.getStudentSubmission(user.id, assignmentId);

        // Block if past due AND not an approved resubmission
        if (now > deadline && (!existingSubmission || !existingSubmission.resubmissionApproved)) {
            return NextResponse.json({ message: "Deadline has passed. Submission is closed." }, { status: 403 });
        }

        try {
            const driveService = new GoogleDriveService();
            const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

            if (!rootFolderId) {
                console.error("Missing GOOGLE_DRIVE_ROOT_FOLDER_ID in environment variables");
                return NextResponse.json({ message: "Server configuration error: Missing Drive Root Folder" }, { status: 500 });
            }

            const assignmentFolderId = await driveService.getOrCreateFolder(assignmentId, rootFolderId);

            // Check if we already have a submission to replace (for approved resubmission)
            const existingSubmission = await service.getStudentSubmission(user.id, assignmentId);
            if (existingSubmission && existingSubmission.resubmissionApproved && existingSubmission.driveFileId) {
                console.log(`[SubmissionRoute] Deleting old file ${existingSubmission.driveFileId} before resubmission`);
                await driveService.deleteFile(existingSubmission.driveFileId);
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const stream = Readable.from(buffer);
            const filename = file.name.replace(/\s/g, '_');
            const uploadResult = await driveService.uploadFile(
                stream,
                filename,
                file.type,
                assignmentFolderId
            );

            const submission = await service.submitAssignment(user.id, {
                assignmentId: assignmentId,
                fileUrl: uploadResult.webViewLink,
                fileName: filename,
                fileSize: file.size,
                mimeType: file.type,
                driveFolderId: assignmentFolderId,
                driveFileId: uploadResult.id
            });

            return NextResponse.json(submission, { status: 201 });

        } catch (submissionError: any) {
            const errorMessage = submissionError.message || 'Unknown error';

            if (errorMessage.includes('already submitted') ||
                errorMessage.includes('pending resubmission request') ||
                errorMessage.includes('Request resubmission permission')) {
                return NextResponse.json({
                    message: errorMessage,
                    canRequestResubmission: errorMessage.includes('already submitted')
                }, { status: 400 });
            }

            throw submissionError;
        }

    } catch (err: any) {
        console.error("Upload error:", err);
        return NextResponse.json({
            message: err.message || "An unexpected error occurred"
        }, { status: 500 });
    }
}
