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
    driveFolderId?: string;
    driveFileId?: string;
    resubmissionRequested?: boolean;
    resubmissionRequestedAt?: Date;
    resubmissionReason?: string;
    resubmissionApproved?: boolean;
    resubmissionApprovedBy?: string;
    resubmissionApprovedAt?: Date;
    resubmissionRejected?: boolean;
    resubmissionRejectionReason?: string;
}

export interface CreateSubmissionDTO {
    assignmentId: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    driveFileId: string;
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
