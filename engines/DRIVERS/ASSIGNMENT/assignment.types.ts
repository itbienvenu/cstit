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
    lecturerEmail?: string;
    lecturerWhatsApp?: string;
    autoSendSubmissions?: boolean;
    isDelivered?: boolean;
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
    lecturerEmail?: string;
    lecturerWhatsApp?: string;
    autoSendSubmissions?: boolean;
}

export interface UpdateAssignmentDTO {
    title?: string;
    description?: string;
    deadlineAt?: Date;
    status?: AssignmentStatus;
    submissionMethod?: SubmissionMethod;
    submissionLink?: string;
    lecturerEmail?: string;
    lecturerWhatsApp?: string;
    autoSendSubmissions?: boolean;
    isDelivered?: boolean;
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
