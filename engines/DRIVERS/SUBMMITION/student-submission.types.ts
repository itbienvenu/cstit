export interface StudentSubmissionEntity {
    id: string;
    assignmentId: string;
    studentId: string;
    fileUrl: string; // Path to the uploaded file
    fileName: string; // Original filename
    submittedAt: Date;
    grade?: number;
    feedback?: string;
}

export interface CreateSubmissionDTO {
    assignmentId: string;
    fileUrl: string;
    fileName: string;
}

export interface SubmissionResponseDTO {
    id: string;
    assignmentId: string;
    studentId: string;
    fileUrl: string;
    fileName: string;
    submittedAt: Date;
    grade?: number;
    feedback?: string;
}
