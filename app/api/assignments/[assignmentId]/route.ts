import { NextResponse } from "next/server";
import { AssignmentServiceImpl } from "@/engines/DRIVERS/ASSIGNMENT/assignment.service";
import { getDb } from "@/lib/db";
import { classMembershipChecker } from "@/lib/classMembershipChecker";
import { getUserFromHeader } from "@/lib/auth";
import { AssignmentRepository } from "@/engines/DRIVERS/ASSIGNMENT/assignment.repository";

interface RouteParams {
    params: Promise<{
        assignmentId: string;
    }>;
}

export async function GET(
    req: Request,
    { params }: RouteParams
) {
    try {
        const user = await getUserFromHeader() as any;
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { assignmentId } = await params;

        const db = await getDb();
        const assignmentCollection = db.collection("assignments") as any;
        const repository = new AssignmentRepository(assignmentCollection);
        const service = new AssignmentServiceImpl(repository, classMembershipChecker);

        const assignment = await service.getAssignmentById(user.id, assignmentId);
        return NextResponse.json(assignment);
    } catch (err: any) {
        if (err.message === 'Assignment not found') {
            return NextResponse.json({ message: err.message }, { status: 404 });
        }
        if (err.message === 'Access denied') {
            return NextResponse.json({ message: err.message }, { status: 403 });
        }
        return NextResponse.json({ message: err.message }, { status: 400 });
    }
}

export async function PUT(
    req: Request,
    { params }: RouteParams
) {
    try {
        const user = await getUserFromHeader() as any;
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { assignmentId } = await params;
        const dto = await req.json();

        // Ensure deadlineAt is a Date object if provided
        if (dto.deadlineAt) {
            dto.deadlineAt = new Date(dto.deadlineAt);
        }

        const db = await getDb();
        const assignmentCollection = db.collection("assignments") as any;
        const repository = new AssignmentRepository(assignmentCollection);
        const service = new AssignmentServiceImpl(repository, classMembershipChecker);

        await service.updateAssignment(user.id, assignmentId, dto);
        return NextResponse.json({ message: "Assignment updated successfully" });
    } catch (err: any) {
        if (err.message === 'Assignment not found') {
            return NextResponse.json({ message: err.message }, { status: 404 });
        }
        if (err.message === 'Not authorized' || err.message === 'User is not class rep') {
            return NextResponse.json({ message: err.message }, { status: 403 });
        }
        return NextResponse.json({ message: err.message }, { status: 400 });
    }
}
