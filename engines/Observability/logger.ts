
import clientPromise from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { LogLevel, LogType, LogEntry, SystemStats } from './types';

const COLLECTION_NAME = 'system_logs';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SMTP_EMAIL;

export class ObservabilityEngine {

    static async log(entry: Omit<LogEntry, 'timestamp'>) {
        try {
            const client = await clientPromise;
            const db = client.db();
            const collection = db.collection(COLLECTION_NAME);

            const logEntry: LogEntry = {
                ...entry,
                timestamp: new Date(),
            };

            await collection.insertOne(logEntry);

            if (entry.level === LogLevel.CRITICAL || entry.level === LogLevel.ERROR) {
                await this.sendAlert(logEntry);
            }

        } catch (error) {
            console.error('Failed to write system log:', error);
            console.error('Original Log Entry:', entry);
        }
    }

    private static async sendAlert(entry: LogEntry) {
        if (!ADMIN_EMAIL) {
            console.warn('No ADMIN_EMAIL or SMTP_EMAIL configured. Skipping alert email.');
            return;
        }

        const subject = `[SYSTEM ALERT] ${entry.level}: ${entry.message}`;
        const text = `
      System Alert
      Level: ${entry.level}
      Type: ${entry.type}
      Message: ${entry.message}
      Timestamp: ${entry.timestamp}
      Endpoint: ${entry.endpoint || 'N/A'}
      Metadata: ${JSON.stringify(entry.metadata, null, 2)}
    `;

        // Basic HTML template
        const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ff4444; border-radius: 5px;">
        <h2 style="color: #d32f2f;">System Alert: ${entry.level}</h2>
        <p><strong>Message:</strong> ${entry.message}</p>
        <p><strong>Type:</strong> ${entry.type}</p>
        <p><strong>Time:</strong> ${entry.timestamp.toISOString()}</p>
        <p><strong>Endpoint:</strong> ${entry.endpoint || 'N/A'}</p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${JSON.stringify(entry.metadata, null, 2)}</pre>
      </div>
    `;

        sendEmail(ADMIN_EMAIL, subject, text, html).catch(err =>
            console.error('Failed to send alert email:', err)
        );
    }

    static async getLogs(limit = 100, filter: Partial<LogEntry> = {}) {
        try {
            const client = await clientPromise;
            const db = client.db();
            return db.collection(COLLECTION_NAME)
                .find(filter)
                .sort({ timestamp: -1 })
                .limit(limit)
                .toArray();
        } catch (e) {
            console.error("Error fetching logs", e);
            return [];
        }
    }

    static async getStats(): Promise<SystemStats> {
        try {
            const client = await clientPromise;
            const db = client.db();
            const collection = db.collection(COLLECTION_NAME);

            const totalLogs = await collection.countDocuments();
            const errorCount = await collection.countDocuments({ level: { $in: [LogLevel.ERROR, LogLevel.CRITICAL] } });
            const warningCount = await collection.countDocuments({ level: LogLevel.WARN });

            return {
                totalLogs,
                errorCount,
                warningCount,
                lastUpdated: new Date()
            };
        } catch (e) {
            console.error("Error fetching stats", e);
            return { totalLogs: 0, errorCount: 0, warningCount: 0, lastUpdated: new Date() };
        }
    }
}

export { LogLevel, LogType };
