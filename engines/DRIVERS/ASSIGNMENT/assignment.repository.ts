import { Collection, ObjectId, WithId } from 'mongodb';
import { AssignmentEntity, AssignmentStatus } from './assignment.types';

export class AssignmentRepository {
    constructor(
        private readonly collection: Collection<WithId<Omit<AssignmentEntity, 'id'>>>
    ) { }

    async insert(assignment: AssignmentEntity): Promise<void> {
        await this.collection.insertOne({
            _id: new ObjectId(assignment.id),
            classId: assignment.classId,
            createdBy: assignment.createdBy,
            title: assignment.title,
            description: assignment.description,
            deadlineAt: assignment.deadlineAt,
            status: assignment.status,
            submissionMethod: assignment.submissionMethod,
            submissionLink: assignment.submissionLink,
            createdAt: assignment.createdAt,
            updatedAt: assignment.updatedAt
        });
    }

    async findById(id: string): Promise<AssignmentEntity | null> {
        const doc = await this.collection.findOne({
            _id: new ObjectId(id)
        });

        if (!doc) return null;

        return this.mapToEntity(doc);
    }

    async findByClassId(classId: string): Promise<AssignmentEntity[]> {
        const docs = await this.collection
            .find({ classId })
            .sort({ deadlineAt: 1 })
            .toArray();

        return docs.map(this.mapToEntity);
    }

    async updateById(
        id: string,
        update: Partial<Omit<AssignmentEntity, 'id' | 'classId' | 'createdBy'>>
    ): Promise<void> {
        await this.collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...update,
                    updatedAt: new Date()
                }
            }
        );
    }

    async closeExpired(now: Date): Promise<number> {
        const result = await this.collection.updateMany(
            {
                status: 'OPEN',
                deadlineAt: { $lte: now }
            },
            {
                $set: {
                    status: 'CLOSED' as AssignmentStatus,
                    updatedAt: now
                }
            }
        );

        return result.modifiedCount;
    }

    private mapToEntity(
        doc: WithId<Omit<AssignmentEntity, 'id'>>
    ): AssignmentEntity {
        return {
            id: doc._id.toHexString(),
            classId: doc.classId,
            createdBy: doc.createdBy,
            title: doc.title,
            description: doc.description,
            deadlineAt: doc.deadlineAt,
            status: doc.status,
            submissionMethod: doc.submissionMethod || 'LINK', // Default to LINK for legacy
            submissionLink: doc.submissionLink,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        };
    }
}
