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

        const driveService = new GoogleDriveService();
        const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

        const assignmentFolderId = await driveService.getOrCreateFolder(assignmentId, rootFolderId);

        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = Readable.from(buffer);
        const filename = file.name.replace(/\s/g, '_'); // Sanitize
        const uploadResult = await driveService.uploadFile(
            stream,
            filename,
            file.type,
            assignmentFolderId
        );

        // 4. Save Record to DB
        const db = await getDb();
        const repository = new SubmissionRepository(db);
        const service = new SubmissionService(repository);

        const submission = await service.submitAssignment(user.id, {
            assignmentId: assignmentId,
            fileUrl: uploadResult.webViewLink, // Google Drive Link
            fileName: filename,
            fileSize: file.size,
            mimeType: file.type
        });

        return NextResponse.json(submission, { status: 201 });

    } catch (err: any) {
        console.error("Upload error:", err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
