export type AssignmentStatus = 'OPEN' | 'CLOSED' | 'GRADED' | 'SUBMITTED';
export type SubmissionMethod = 'LINK' | 'FILE';

export interface AssignmentEntity {
    id: string;
    classId: string;
    createdBy: string;
    title: string;
    description: string;
    deadlineAt: Date;
    status: AssignmentStatus;
    submissionMethod: SubmissionMethod;
    submissionLink?: string; // Used if method is LINK
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface CreateAssignmentDTO {
    classId: string;
    title: string;
    description: string;
    deadlineAt: Date;
    submissionMethod: SubmissionMethod;
    submissionLink?: string;
}

export interface UpdateAssignmentDTO {
    title?: string;
    description?: string;
    deadlineAt?: Date;
    status?: AssignmentStatus;
    submissionMethod?: SubmissionMethod;
    submissionLink?: string;
}

export interface AssignmentResponseDTO {
    id: string;
    classId: string;
    title: string;
    description: string;
    deadlineAt: Date;
    status: AssignmentStatus;
    submissionMethod: SubmissionMethod;
    submissionLink?: string;
    createdAt: Date;
    updatedAt: Date;

    creator: {
        id: string;
        name: string;
    };
}

export interface DeleteAssignmentParams {
    assignmentId: string;
}

export interface GetAssignmentByIdParams {
    assignmentId: string;
}
