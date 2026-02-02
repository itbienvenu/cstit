require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');

// CONFIGURATION - Use localhost for easier OAuth flow
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/api/auth/callback';

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Critical for getting a Refresh Token
    scope: SCOPES,
    prompt: 'select_account consent' // Force account selection AND consent
});

console.log('Authorize this app by visiting this url:');
console.log('--------------------------------------------------');
console.log(authUrl);
console.log('--------------------------------------------------');
console.log('\nSteps:');
console.log('1. Open the URL above in your browser.');
console.log('2. Log in with YOUR @gmail.com account (the one that owns the folder).');
console.log('3. Click "Continue" or "Advanced" -> "Go to [app name] (unsafe)"');
console.log('4. Grant permissions for Google Drive access.');
console.log('5. You will be redirected to localhost (page may not load - THAT\'S OK!).');
console.log('6. Look at the URL bar and copy everything after "?code=" up to (but not including) "&scope"');
console.log('7. Paste that CODE here:');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question('Enter the code from the page here: ', async (code) => {
    try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log('\nSUCCESS! Here is your Refresh Token:');
        console.log('--------------------------------------------------');
        console.log('GOOGLE_DRIVE_REFRESH_TOKEN=' + tokens.refresh_token);
        console.log('--------------------------------------------------');
        console.log('\nNow add the following to your .env file:');
        console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
        console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
        console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
    } catch (err) {
        console.error('Error retrieving access token:', err.message);
    }
    rl.close();
});
