import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

export class GoogleDriveService {
    private drive;

    constructor() {
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        const impersonatedUser = process.env.GOOGLE_DRIVE_IMPERSONATED_USER_EMAIL;

        if (!clientEmail || !privateKey) {
            throw new Error('Missing Google Drive Credentials (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY)');
        }

        const authOptions: any = {
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: SCOPES,
        };

        if (impersonatedUser) {
            authOptions.clientOptions = {
                subject: impersonatedUser,
                timeout: 30000,
            };
        } else {
            authOptions.clientOptions = {
                timeout: 30000,
            };
        }

        const auth = new google.auth.GoogleAuth(authOptions);

        this.drive = google.drive({
            version: 'v3',
            auth,
        });

        console.log(`[GoogleDriveService] Initialized with Service Account: ${clientEmail}`);
        if (impersonatedUser) {
            console.log(`[GoogleDriveService] Impersonating User: ${impersonatedUser}`);
        }
    }

    /**
     * Creates a folder or returns existing one if found by name in the parent
     */
    async getOrCreateFolder(folderName: string, parentId?: string): Promise<string> {
        if (!parentId) {
            console.error('[GoogleDriveService] WARNING: No parentId provided for folder creation. Service accounts cannot create root folders.');
        }

        // 1. Check if exists
        let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
        if (parentId) {
            query += ` and '${parentId}' in parents`;
        }

        try {
            const res = await this.drive.files.list({
                q: query,
                fields: 'files(id, name)',
                spaces: 'drive',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
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
            } else {
                // If no parent is provided, this will likely fail for service accounts
                console.warn('[GoogleDriveService] Attempting to create folder in root. This will fail if the service account has no storage quota.');
            }

            const file = await this.drive.files.create({
                requestBody: fileMetadata,
                fields: 'id',
                supportsAllDrives: true,
            });

            return file.data.id!;
        } catch (error: any) {
            console.error('[GoogleDriveService] Error in getOrCreateFolder:', error);
            throw new Error(`Google Drive Folder Error: ${error.message}`);
        }
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

        try {
            const file = await this.drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, webViewLink',
                supportsAllDrives: true,
            });

            return {
                id: file.data.id!,
                webViewLink: file.data.webViewLink!,
            };
        } catch (error: any) {
            console.error('[GoogleDriveService] Upload Error Full Details:', JSON.stringify(error.response?.data || error, null, 2));
            throw error;
        }
    }
}
