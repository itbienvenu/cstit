import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

export class GoogleDriveService {
    private drive;

    constructor() {
        const clientId = process.env.CLIENT_ID;
        const clientSecret = process.env.CLIENT_SECRET;
        const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

        if (!clientId || !clientSecret || !refreshToken) {
            throw new Error('Missing Google Drive OAuth Credentials (CLIENT_ID, CLIENT_SECRET, GOOGLE_DRIVE_REFRESH_TOKEN)');
        }

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            process.env.REDIRECT_URI || 'https://developers.google.com/oauthplayground'
        );

        oauth2Client.setCredentials({
            refresh_token: refreshToken,
        });

        this.drive = google.drive({
            version: 'v3',
            auth: oauth2Client,
        });

        console.log(`[GoogleDriveService] Initialized with OAuth 2.0`);
    }

    /**
     * Creates a folder or returns existing one if found by name in the parent
     */
    async getOrCreateFolder(folderName: string, parentId?: string): Promise<string> {
        let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
        if (parentId) {
            query += ` and '${parentId}' in parents`;
        }

        try {
            const res = await this.drive.files.list({
                q: query,
                fields: 'files(id, name)',
                spaces: 'drive',
            });

            if (res.data.files && res.data.files.length > 0) {
                return res.data.files[0].id!;
            }

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

    /**
     * Deletes a file by its ID
     */
    async deleteFile(fileId: string): Promise<void> {
        try {
            await this.drive.files.delete({
                fileId: fileId,
            });
            console.log(`[GoogleDriveService] Successfully deleted file ${fileId}`);
        } catch (error: any) {
            console.error(`[GoogleDriveService] Error deleting file ${fileId}:`, error);
            // We don't necessarily want to throw and block everything if deletion fails, 
            // but for now, let's keep it observable.
        }
    }
}
