import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { SubmissionRepository } from "@/engines/DRIVERS/SUBMMITION/submission.repository";
import { SubmissionService } from "@/engines/DRIVERS/SUBMMITION/submission.service";
import { DeliveryService } from "@/engines/DRIVERS/ASSIGNMENT/delivery.service";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Basic security check (Cron secret)
        const { searchParams } = new URL(req.url);
        const secret = searchParams.get('secret');

        if (secret !== process.env.CRON_SECRET) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const db = await getDb();
        const repository = new SubmissionRepository(db);
        const submissionService = new SubmissionService(repository);
        const deliveryService = new DeliveryService(submissionService);

        await deliveryService.processPendingDeliveries();

        return NextResponse.json({ message: "Cron processed successfully" }, { status: 200 });
    } catch (err: any) {
        console.error("Cron error:", err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
