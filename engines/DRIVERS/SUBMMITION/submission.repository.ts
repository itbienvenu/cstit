import { Db, Collection, ObjectId } from 'mongodb';
import { StudentSubmissionEntity } from './student-submission.types';

export class SubmissionRepository {
    private collection: Collection;

    constructor(db: Db) {
        this.collection = db.collection('submissions');
    }

    async insert(submission: StudentSubmissionEntity): Promise<void> {
        await this.collection.insertOne({
            _id: new ObjectId(submission.id),
            assignmentId: submission.assignmentId,
            studentId: submission.studentId,
            fileUrl: submission.fileUrl,
            fileName: submission.fileName,
            fileSize: submission.fileSize,
            mimeType: submission.mimeType,
            submittedAt: submission.submittedAt,
            grade: submission.grade,
            feedback: submission.feedback
        });
    }

    async findByAssignmentId(assignmentId: string): Promise<StudentSubmissionEntity[]> {
        const docs = await this.collection
            .find({ assignmentId })
            .sort({ submittedAt: -1 })
            .toArray();

        return docs.map(this.mapToEntity);
    }

    async findByStudentAndAssignment(studentId: string, assignmentId: string): Promise<StudentSubmissionEntity | null> {
        const doc = await this.collection.findOne({ studentId, assignmentId });
        if (!doc) return null;
        return this.mapToEntity(doc);
    }

    private mapToEntity(doc: any): StudentSubmissionEntity {
        return {
            id: doc._id.toHexString(),
            assignmentId: doc.assignmentId,
            studentId: doc.studentId,
            fileUrl: doc.fileUrl,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            submittedAt: doc.submittedAt,
            grade: doc.grade,
            feedback: doc.feedback
        };
    }
}
