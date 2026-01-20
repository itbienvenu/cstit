import { ObjectId } from 'mongodb';
import { NextResponse } from "next/server";
import { AssignmentServiceImpl } from "@/engines/DRIVERS/ASSIGNMENT/assignment.service";
import { getDb } from "@/lib/db";
import { classMembershipChecker } from "@/lib/classMembershipChecker";
import { getUserFromHeader } from "@/lib/auth";
import { AssignmentRepository } from "@/engines/DRIVERS/ASSIGNMENT/assignment.repository";
import { GoogleDriveService } from "@/lib/drive";

export async function POST(req: Request) {
    try {
        const user = await getUserFromHeader() as any;
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const db = await getDb();
        const assignmentCollection = db.collection("assignments") as any;
        const repository = new AssignmentRepository(assignmentCollection);
        const driveService = new GoogleDriveService();
        const service = new AssignmentServiceImpl(repository, classMembershipChecker, driveService);

        const dto = await req.json();
        // Ensure deadlineAt is a Date object
        if (dto.deadlineAt) {
            dto.deadlineAt = new Date(dto.deadlineAt);
        }

        const assignment = await service.createAssignment(user.id, dto);
        return NextResponse.json(assignment, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 400 });
    }
}

export async function GET(req: Request) {
    try {
        const user = await getUserFromHeader() as any;
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        let classId = searchParams.get("classId");

        const db = await getDb();

        if (!classId) {
            // Auto-detect class from user profile
            const usersCollection = db.collection("users");
            const userProfile = await usersCollection.findOne({ _id: new ObjectId(user.id) });

            if (userProfile && userProfile.organizationId) {
                classId = userProfile.organizationId;
            } else {
                return NextResponse.json({ message: "Class ID is required or user is not in a class" }, { status: 400 });
            }
        }

        const assignmentCollection = db.collection("assignments") as any;
        const repository = new AssignmentRepository(assignmentCollection);
        const driveService = new GoogleDriveService();
        const service = new AssignmentServiceImpl(repository, classMembershipChecker, driveService);

        const assignments = await service.getAssignmentsForClass(user.id, classId as string);
        return NextResponse.json(assignments);
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 400 });
    }
}
