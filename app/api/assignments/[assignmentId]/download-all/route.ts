import { NextResponse } from "next/server";
import { getUserFromHeader } from "@/lib/auth";
import { getDb } from "@/lib/db";
import clientPromise from "@/lib/db";
import { SubmissionRepository } from "@/engines/DRIVERS/SUBMMITION/submission.repository";
import { SubmissionService } from "@/engines/DRIVERS/SUBMMITION/submission.service";
import { ObjectId } from "mongodb";
import { classMembershipChecker } from "@/lib/classMembershipChecker";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        const { assignmentId } = await params;
        const user = await getUserFromHeader() as any;

        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const db = await getDb();

        const assignmentsCollection = db.collection("assignments") as any;
        const assignment = await assignmentsCollection.findOne({ _id: new ObjectId(assignmentId) });

        if (!assignment) {
            return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
        }

        // Check permissions: Must be class_rep or super_admin AND member of the class (for class_rep)
        if (user.role === 'super_admin') {
            // Super admin access granted
        } else if (user.role === 'class_rep') {
            const isMember = await classMembershipChecker(user.id, assignment.classId, 'class_rep');
            if (!isMember) {
                return NextResponse.json({ message: "Access denied: Only Class Reps of this class can download submissions" }, { status: 403 });
            }
        } else {
            return NextResponse.json({ message: "Access denied" }, { status: 403 });
        }

        const repository = new SubmissionRepository(db);
        const service = new SubmissionService(repository);

        // Fetch submissions to get student IDs
        const submissions = await service.getSubmissionsForAssignment(assignmentId);

        if (submissions.length === 0) {
            return NextResponse.json({ message: "No submissions found to zip" }, { status: 400 });
        }

        // Fetch student names
        const studentIds = submissions.map(s => new ObjectId(s.studentId));
        const client = await clientPromise;
        const usersDb = client.db('blog_app');
        const usersCollection = usersDb.collection('users');

        const students = await usersCollection.find({ _id: { $in: studentIds } }).toArray();

        const studentMap = new Map<string, string>();
        students.forEach((student: any) => {
            studentMap.set(student._id.toString(), student.name);
        });

        // Generate ZIP
        const zipBuffer = await service.generateSubmissionsZip(assignmentId, studentMap);

        const filename = `submissions_${assignment.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`;

        return new NextResponse(new Uint8Array(zipBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (err: any) {
        console.error("Download ZIP error:", err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
