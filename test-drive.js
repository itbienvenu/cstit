
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

async function testUpload() {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

    if (!clientEmail || !privateKey || !rootFolderId) {
        console.error("Missing configuration in .env");
        return;
    }

    const auth = new google.auth.GoogleAuth({
        credentials: { client_email: clientEmail, private_key: privateKey },
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    console.log(`Authenticated as: ${clientEmail}`);
    console.log(`Target Root Folder: ${rootFolderId}`);

    try {
        // 1. Check Root Folder Access
        console.log("Checking root folder access...");
        const folder = await drive.files.get({
            fileId: rootFolderId,
            fields: 'id, name, capabilities, owners, driveId',
            supportsAllDrives: true
        });
        console.log("Root Folder detected:", folder.data.name);
        console.log("Capabilities:", folder.data.capabilities);
        console.log("Owners:", folder.data.owners);

        // 2. Try to create a small file
        console.log("Attempting test file upload...");
        const res = await drive.files.create({
            requestBody: {
                name: 'test_upload_probe.txt',
                parents: [rootFolderId]
            },
            media: {
                mimeType: 'text/plain',
                body: 'Hello World - Quota Test'
            },
            supportsAllDrives: true
        });

        console.log("SUCCESS! File uploaded with ID:", res.data.id);

        // Cleanup
        await drive.files.delete({ fileId: res.data.id, supportsAllDrives: true });
        console.log("Test file cleaned up.");

    } catch (err) {
        console.error("TEST FAILED:");
        if (err.response) {
            console.error(JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err.message);
        }
    }
}

testUpload();
