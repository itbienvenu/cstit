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
            console.log("[API][GET /assignments] Unauthorized: No user found");
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        let classId = searchParams.get("classId");

        console.log(`[API][GET /assignments] User ID: ${user.id}, Initial Class ID: ${classId}`);

        const db = await getDb();

        if (!classId) {
            if (user.organizationId) {
                classId = user.organizationId;
                console.log(`[API][GET /assignments] Used Class ID from Token: ${classId}`);
            } else {
                const usersCollection = db.collection("users");
                console.log(`[API][GET /assignments] Searching for user with _id: ${user.id} (as ObjectId: ${ObjectId.isValid(user.id)})`);

                let userProfile;
                try {
                    if (ObjectId.isValid(user.id)) {
                        userProfile = await usersCollection.findOne({ _id: new ObjectId(user.id) });
                    }

                    if (!userProfile) {
                        console.log(`[API][GET /assignments] User not found by ObjectId. Trying by string _id or 'id' field...`);
                        userProfile = await usersCollection.findOne({
                            $or: [
                                { _id: user.id },
                                { id: user.id }
                            ]
                        });
                    }
                } catch (queryErr) {
                    console.error("[API][GET /assignments] Error querying user profile:", queryErr);
                }

                if (userProfile && userProfile.organizationId) {
                    classId = userProfile.organizationId;
                    console.log(`[API][GET /assignments] Auto-detected Class ID: ${classId}`);
                } else {
                    console.log("[API][GET /assignments] Failed to detect Class ID. foundUser:", userProfile ? "YES" : "NO", "OrgId:", userProfile?.organizationId);
                    // Try one more lookup strategy: check if there is an 'id' field instead of '_id'
                    if (!userProfile) {
                        const userById = await usersCollection.findOne({ id: user.id });
                        if (userById && userById.organizationId) {
                            classId = userById.organizationId;
                            console.log(`[API][GET /assignments] Auto-detected Class ID via 'id' field: ${classId}`);
                        }
                    }

                    if (!classId) {
                        return NextResponse.json({ message: "Class ID associated with user not found" }, { status: 400 });
                    }
                }
            }
        }

        const assignmentCollection = db.collection("assignments") as any;
        const repository = new AssignmentRepository(assignmentCollection);
        const driveService = new GoogleDriveService();
        const service = new AssignmentServiceImpl(repository, classMembershipChecker, driveService);

        console.log(`[API][GET /assignments] Calling service.getAssignmentsForClass with User: ${user.id}, Class: ${classId}`);
        const assignments = await service.getAssignmentsForClass(user.id, classId as string);
        console.log(`[API][GET /assignments] Found ${assignments.length} assignments`);
        return NextResponse.json(assignments);
    } catch (err: any) {
        console.error("[API][GET /assignments] CRITICAL ERROR:", err);
        return NextResponse.json({
            message: err.message || "Unknown error occurred",
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }, { status: 500 });
    }
}
