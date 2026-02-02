import { ObjectId } from 'mongodb';
import { StudentSubmissionEntity, CreateSubmissionDTO } from './student-submission.types';
import { SubmissionRepository } from './submission.repository';

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
}
