import { ObjectId } from 'mongodb';
import { StudentSubmissionEntity, CreateSubmissionDTO } from './student-submission.types';
import { SubmissionRepository } from './submission.repository';
import { GoogleDriveService } from '@/lib/drive';
import JSZip from 'jszip';
import { Readable } from 'stream';

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
};

export class SubmissionService {
    constructor(private readonly submissionRepository: SubmissionRepository) { }

    async submitAssignment(
        userId: string,
        dto: CreateSubmissionDTO & { driveFolderId?: string }
    ): Promise<StudentSubmissionEntity> {
        const existingSubmission = await this.submissionRepository.findByStudentAndAssignment(userId, dto.assignmentId);

        if (existingSubmission) {
            if (existingSubmission.resubmissionRequested && !existingSubmission.resubmissionApproved) {
                throw new Error('You have a pending resubmission request. Please wait for class rep approval.');
            }

            if (!existingSubmission.resubmissionApproved) {
                throw new Error('You have already submitted this assignment. Request resubmission permission from your class rep if you need to update it.');
            }

            await this.submissionRepository.deleteById(existingSubmission.id);
        }

        const submission: StudentSubmissionEntity = {
            id: new ObjectId().toHexString(),
            assignmentId: dto.assignmentId,
            studentId: userId,
            fileUrl: dto.fileUrl,
            fileName: dto.fileName,
            fileSize: dto.fileSize,
            mimeType: dto.mimeType,
            submittedAt: new Date(),
            driveFolderId: dto.driveFolderId,
            driveFileId: dto.driveFileId
        };

        await this.submissionRepository.insert(submission);
        return submission;
    }

    async getSubmissionsForAssignment(assignmentId: string): Promise<StudentSubmissionEntity[]> {
        return this.submissionRepository.findByAssignmentId(assignmentId);
    }

    async getStudentSubmission(userId: string, assignmentId: string): Promise<StudentSubmissionEntity | null> {
        return this.submissionRepository.findByStudentAndAssignment(userId, assignmentId);
    }

    async requestResubmission(userId: string, assignmentId: string, reason: string): Promise<StudentSubmissionEntity> {
        const submission = await this.submissionRepository.findByStudentAndAssignment(userId, assignmentId);

        if (!submission) {
            throw new Error('No submission found for this assignment');
        }

        if (submission.resubmissionRequested) {
            throw new Error('You have already requested resubmission. Please wait for approval.');
        }

        submission.resubmissionRequested = true;
        submission.resubmissionRequestedAt = new Date();
        submission.resubmissionReason = reason;
        submission.resubmissionRejected = false; // Clear rejection if re-requesting

        await this.submissionRepository.update(submission.id, submission);
        return submission;
    }

    async approveResubmission(submissionId: string, classRepId: string): Promise<StudentSubmissionEntity> {
        const submission = await this.submissionRepository.findById(submissionId);

        if (!submission) {
            throw new Error('Submission not found');
        }

        if (!submission.resubmissionRequested) {
            throw new Error('No resubmission request found');
        }

        submission.resubmissionApproved = true;
        submission.resubmissionApprovedBy = classRepId;
        submission.resubmissionApprovedAt = new Date();
        submission.resubmissionRejected = false;

        await this.submissionRepository.update(submissionId, submission);
        return submission;
    }

    async rejectResubmission(submissionId: string, reason?: string): Promise<StudentSubmissionEntity> {
        const submission = await this.submissionRepository.findById(submissionId);

        if (!submission) {
            throw new Error('Submission not found');
        }

        submission.resubmissionRequested = false;
        submission.resubmissionApproved = false;
        submission.resubmissionRejected = true;
        submission.resubmissionRejectionReason = reason;

        await this.submissionRepository.update(submissionId, submission);
        return submission;
    }

    async getPendingResubmissionRequests(assignmentId: string): Promise<StudentSubmissionEntity[]> {
        return this.submissionRepository.findPendingResubmissions(assignmentId);
    }

    async generateSubmissionsZip(assignmentId: string, studentMap: Map<string, string>): Promise<Buffer> {
        const submissions = await this.submissionRepository.findByAssignmentId(assignmentId);
        const driveService = new GoogleDriveService();
        const zip = new JSZip();

        // Filter out submissions without files or duplicates (keep latest? findByAssignmentId sorts by submittedAt desc, so we might have multiple? No, repo usually returns one per student? No, it returns all. Logic usually enforces one active submission.)
        // But let's assume one per student for now or just zip them all.
        // Actually findByAssignmentId returns array.

        const folderName = `assignment_${assignmentId}_submissions`;
        const folder = zip.folder(folderName);

        if (!folder) {
            throw new Error("Failed to create zip folder");
        }

        const processedFiles = new Set<string>();

        await Promise.all(submissions.map(async (submission) => {
            if (!submission.driveFileId) return;

            try {
                const studentName = studentMap.get(submission.studentId) || 'Unknown_Student';
                const sanitizedStudentName = studentName.replace(/[^a-zA-Z0-9_-]/g, '_');
                const originalName = submission.fileName || 'submission';

                // Create unique filename: StudentName_OriginalName
                let fileName = `${sanitizedStudentName}_${originalName}`;

                // Handle duplicates
                let counter = 1;
                while (processedFiles.has(fileName)) {
                    fileName = `${sanitizedStudentName}_${counter}_${originalName}`;
                    counter++;
                }
                processedFiles.add(fileName);

                const stream = await driveService.downloadFile(submission.driveFileId);
                const buffer = await streamToBuffer(stream);

                folder.file(fileName, buffer);
            } catch (error) {
                console.error(`Failed to download file for submission ${submission.id}:`, error);
                folder.file(`ERROR_${submission.id}.txt`, `Failed to download file: ${error}`);
            }
        }));

        return zip.generateAsync({ type: "nodebuffer" });
    }
}
