import nodemailer from 'nodemailer';
import { AssignmentEntity } from './assignment.types';
import { SubmissionService } from '../SUBMMITION/submission.service';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/db';

export class DeliveryService {
    constructor(private readonly submissionService: SubmissionService) { }

    async processPendingDeliveries() {
        const db = await getDb();
        const assignmentsCollection = db.collection('assignments');

        // Find assignments past deadline, with autoSendSubmissions enabled, and not yet delivered
        const now = new Date();
        const pendingAssignments = await assignmentsCollection.find({
            deadlineAt: { $lt: now },
            autoSendSubmissions: true,
            isDelivered: { $ne: true },
            deletedAt: { $exists: false }
        }).toArray() as any[];

        console.log(`Found ${pendingAssignments.length} pending deliveries`);

        for (const assignment of pendingAssignments) {
            try {
                await this.deliverAssignment(assignment);
                await assignmentsCollection.updateOne(
                    { _id: assignment._id },
                    { $set: { isDelivered: true, deliveredAt: new Date() } }
                );
                console.log(`Successfully delivered assignment: ${assignment.title}`);
            } catch (error) {
                console.error(`Failed to deliver assignment ${assignment._id}:`, error);
            }
        }
    }

    private async deliverAssignment(assignment: any) {
        if (!assignment.lecturerEmail) {
            throw new Error(`No lecturer email defined for assignment: ${assignment.title}`);
        }

        // 1. Prepare student map for the zip
        const submissions = await this.submissionService.getSubmissionsForAssignment(assignment._id.toString());
        const studentIds = submissions.map(s => new ObjectId(s.studentId));

        const client = await clientPromise;
        const usersDb = client.db('blog_app');
        const usersCollection = usersDb.collection('users');
        const students = await usersCollection.find({ _id: { $in: studentIds } }).toArray();

        const studentMap = new Map<string, string>();
        students.forEach((student: any) => {
            studentMap.set(student._id.toString(), student.name);
        });

        // 2. Generate ZIP
        const zipBuffer = await this.submissionService.generateSubmissionsZip(assignment._id.toString(), studentMap);

        // 3. Find Class Rep for "Sent As" persona
        const classRep = await usersCollection.findOne({
            organizationId: assignment.classId,
            role: 'class_rep'
        });

        // 4. Send Email
        await this.sendEmail(assignment, zipBuffer, classRep);
    }

    private async sendEmail(assignment: any, zipBuffer: Buffer, classRep?: any) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const filename = `submissions_${assignment.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`;

        // Check size (Gmail limit is ~25MB)
        const sizeInMB = zipBuffer.length / (1024 * 1024);

        // Mask sender as Class Rep if found
        const fromName = classRep ? `${classRep.name} (Class Rep)` : 'STUBLG';
        const replyToEmail = classRep?.email || process.env.SMTP_EMAIL;

        const mailOptions: any = {
            from: `"${fromName}" <${replyToEmail}>`,
            replyTo: replyToEmail,
            to: assignment.lecturerEmail,
            subject: `[Submissions] All submissions for: ${assignment.title}`,
            text: `Hello,\n\nPlease find attached all submitted assignments for "${assignment.title}".\n\nTotal submissions: ${submissionsCount(zipBuffer)}\n\nThis is an automated delivery from URCSTIT Blog App on behalf of your Class Representative${classRep ? ` (${classRep.name})` : ''}.`,
        };

        function submissionsCount(buffer: Buffer) {
            return buffer.length > 0 ? 'Included in zip' : '0';
        }

        if (sizeInMB < 20) {
            mailOptions.attachments = [
                {
                    filename: filename,
                    content: zipBuffer,
                }
            ];
        } else {
            // If too large, we would ideally upload to drive and send a link.
            // For now, let's just warn or send a link to the existing download endpoint.
            const downloadLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/assignments/${assignment._id}/download-all`;
            mailOptions.text += `\n\n The ZIP file was too large to attach (${sizeInMB.toFixed(2)} MB).\nYou can download it directly here: ${downloadLink}`;
        }

        await transporter.sendMail(mailOptions);
    }
}
