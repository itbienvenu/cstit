
const { google } = require('googleapis');
const readline = require('readline');

// CONFIGURATION
const { CLIENT_SECRET, CLIENT_ID, REDIRECT_URI } = process.env;

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Critical for getting a Refresh Token
    scope: SCOPES,
    prompt: 'consent' // Force consent to ensure refresh token is returned
});

console.log('Authorize this app by visiting this url:');
console.log('--------------------------------------------------');
console.log(authUrl);
console.log('--------------------------------------------------');
console.log('\nSteps:');
console.log('1. Open the URL above in your browser.');
console.log('2. Log in with YOUR @gmail.com account (the one that owns the folder).');
console.log('3. "Continue" through any warnings (since this is your own dev app).');
console.log('4. You will be redirected to OAuth Playground.');
console.log('5. Look at the "Authorization code" box on the left (or in the URL bar ?code=...).');
console.log('6. Copy that CODE and paste it here:');

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
