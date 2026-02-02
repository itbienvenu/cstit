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

        try {
            const driveService = new GoogleDriveService();
            const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

            if (!rootFolderId) {
                console.error("Missing GOOGLE_DRIVE_ROOT_FOLDER_ID in environment variables");
                return NextResponse.json({ message: "Server configuration error: Missing Drive Root Folder" }, { status: 500 });
            }

            const assignmentFolderId = await driveService.getOrCreateFolder(assignmentId, rootFolderId);

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
                driveFolderId: assignmentFolderId
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
