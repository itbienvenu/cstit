import { ObjectId } from 'mongodb';
import { StudentSubmissionEntity, CreateSubmissionDTO } from './student-submission.types';
import { SubmissionRepository } from './submission.repository';

export class SubmissionService {
    constructor(private readonly submissionRepository: SubmissionRepository) { }

    async submitAssignment(
        userId: string,
        dto: CreateSubmissionDTO
    ): Promise<StudentSubmissionEntity> {
        // Here we could check if assignment is OPEN, etc. (skipping for now for speed)

        const submission: StudentSubmissionEntity = {
            id: new ObjectId().toHexString(),
            assignmentId: dto.assignmentId,
            studentId: userId,
            fileUrl: dto.fileUrl,
            fileName: dto.fileName,
            submittedAt: new Date()
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
}
