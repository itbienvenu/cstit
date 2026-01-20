import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export class GoogleDriveService {
    private drive;

    constructor() {
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!clientEmail || !privateKey) {
            throw new Error('Missing Google Drive Credentials (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY)');
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: SCOPES,
        });

        this.drive = google.drive({ version: 'v3', auth });
    }

    /**
     * Creates a folder or returns existing one if found by name in the parent
     */
    async getOrCreateFolder(folderName: string, parentId?: string): Promise<string> {
        // 1. Check if exists
        let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
        if (parentId) {
            query += ` and '${parentId}' in parents`;
        }

        const res = await this.drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (res.data.files && res.data.files.length > 0) {
            return res.data.files[0].id!;
        }

        // 2. Create if not exists
        const fileMetadata: any = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
        };

        if (parentId) {
            fileMetadata.parents = [parentId];
        }

        const file = await this.drive.files.create({
            requestBody: fileMetadata,
            fields: 'id',
        });

        return file.data.id!;
    }

    /**
     * Uploads a file stream to a specific folder
     */
    async uploadFile(
        fileStream: Readable,
        fileName: string,
        mimeType: string,
        folderId: string
    ): Promise<{ id: string; webViewLink: string }> {
        const fileMetadata = {
            name: fileName,
            parents: [folderId],
        };

        const media = {
            mimeType: mimeType,
            body: fileStream,
        };

        const file = await this.drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink',
        });

        return {
            id: file.data.id!,
            webViewLink: file.data.webViewLink!,
        };
    }
}
