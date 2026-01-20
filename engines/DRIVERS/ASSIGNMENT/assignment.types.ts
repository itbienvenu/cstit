export type AssignmentStatus = 'OPEN' | 'CLOSED' | 'GRADED' | 'SUBMITTED';

export interface AssignmentEntity {
    id: string;
    classId: string;
    createdBy: string;
    title: string;
    description: string;
    deadlineAt: Date;
    status: AssignmentStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAssignmentDTO {
    classId: string;
    title: string;
    description: string;
    deadlineAt: Date;
}

export interface UpdateAssignmentDTO {
    title?: string;
    description?: string;
    deadlineAt?: Date;
    status?: AssignmentStatus;
}

export interface AssignmentResponseDTO {
    id: string;
    classId: string;
    title: string;
    description: string;
    deadlineAt: Date;
    status: AssignmentStatus;
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
