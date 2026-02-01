export interface StudentSubmissionEntity {
    id: string;
    assignmentId: string;
    studentId: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    submittedAt: Date;
    grade?: number;
    feedback?: string;
}

export interface CreateSubmissionDTO {
    assignmentId: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
}

export interface SubmissionResponseDTO {
    id: string;
    assignmentId: string;
    studentId: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    submittedAt: Date;
    grade?: number;
    feedback?: string;
}
