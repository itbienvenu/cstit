export interface StudentSubmissionEntity {
    id: string;
    assignmentId: string;
    studentId: string;
    fileUrl: string; // Path to the uploaded file
    fileName: string; // Original filename
    fileSize: number; // Size in bytes
    mimeType: string; // e.g., 'application/pdf'
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
