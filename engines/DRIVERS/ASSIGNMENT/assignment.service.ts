import { ObjectId } from 'mongodb';
import {
    AssignmentEntity,
    CreateAssignmentDTO,
    UpdateAssignmentDTO,
    AssignmentResponseDTO
} from './assignment.types';
import { AssignmentRepository } from './assignment.repository';

export class AssignmentServiceImpl implements AssignmentServiceImpl {
    constructor(
        private readonly assignmentRepository: AssignmentRepository,
        private readonly classMembershipChecker: (
            userId: string,
            classId: string,
            role?: 'student' | 'class_rep'
        ) => Promise<boolean>
    ) { }

    async createAssignment(
        userId: string,
        dto: CreateAssignmentDTO
    ): Promise<AssignmentEntity> {
        const isRep = await this.classMembershipChecker(
            userId,
            dto.classId,
            'class_rep'
        );

        if (!isRep) {
            throw new Error('User is not class rep');
        }

        if (dto.deadlineAt <= new Date()) {
            throw new Error('Deadline must be in the future');
        }

        const now = new Date();

        const assignment: AssignmentEntity = {
            id: new ObjectId().toHexString(),
            classId: dto.classId,
            createdBy: userId,
            title: dto.title,
            description: dto.description,
            deadlineAt: dto.deadlineAt,
            status: 'OPEN',
            submissionMethod: dto.submissionMethod,
            submissionLink: dto.submissionLink, // Pass the link
            createdAt: now,
            updatedAt: now
        };

        await this.assignmentRepository.insert(assignment);

        return assignment;
    }

    async updateAssignment(
        userId: string,
        assignmentId: string,
        dto: UpdateAssignmentDTO
    ): Promise<void> {
        const assignment = await this.assignmentRepository.findById(assignmentId);

        if (!assignment) {
            throw new Error('Assignment not found');
        }

        const isRep = await this.classMembershipChecker(
            userId,
            assignment.classId,
            'class_rep'
        );

        if (!isRep) {
            throw new Error('Not authorized');
        }

        if (assignment.status === 'CLOSED') {
            throw new Error('Assignment already closed');
        }

        await this.assignmentRepository.updateById(assignmentId, dto);
    }

    async getAssignmentsForClass(
        userId: string,
        classId: string
    ): Promise<AssignmentResponseDTO[]> {
        const allowed = await this.classMembershipChecker(userId, classId);

        if (!allowed) {
            throw new Error('Access denied');
        }

        const assignments = await this.assignmentRepository.findByClassId(classId);

        return assignments.map(a => ({
            id: a.id,
            classId: a.classId,
            title: a.title,
            description: a.description,
            deadlineAt: a.deadlineAt,
            status: a.status,
            submissionMethod: a.submissionMethod,
            submissionLink: a.submissionLink,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
            creator: {
                id: a.createdBy,
                name: a.createdBy,
            }
        }));
    }

    async getAssignmentById(
        userId: string,
        assignmentId: string
    ): Promise<AssignmentEntity> {
        const assignment = await this.assignmentRepository.findById(assignmentId);

        if (!assignment) {
            throw new Error('Assignment not found');
        }

        const allowed = await this.classMembershipChecker(userId, assignment.classId);

        if (!allowed) {
            throw new Error('Access denied');
        }

        return assignment;
    }

    async closeExpiredAssignments(): Promise<number> {
        return this.assignmentRepository.closeExpired(new Date());
    }
}
