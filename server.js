const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline-sync');

// Path to your credentials.json file
const CREDENTIALS_PATH = 'credentials.json';
const TOKEN_PATH = 'token.json'; // This file stores the user's access and refresh tokens

// Scopes needed to access Google Drive and transfer ownership
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Authorize the client
async function authorize() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  } else {
    return getNewToken(oAuth2Client);
  }
}

// Get a new token from the user
function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:');
  console.log(authUrl);

  const code = readline.question('Enter the code from that page here: ');

  return oAuth2Client.getToken(code).then(({ tokens }) => {
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    return oAuth2Client;
  });
}

// Transfer ownership of a file
async function transferOwnership(auth) {
  const drive = google.drive({ version: 'v3', auth });

  const fileId = readline.question('https://drive.google.com/file/d/1vV6D16a3vyolGje_nl9LZ4rUzKUUA5Kl/view?usp=drive_link'); // File ID
  const newOwnerEmail = readline.question('zackraven20201@gmail.com'); // New owner's email

  try {
    const file = await drive.files.get({ fileId });
    console.log(`File: ${file.data.name}`);

    // Add the new owner as an editor first
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        type: 'user',
        role: 'editor',
        emailAddress: newOwnerEmail,
      },
    });

    // Transfer ownership by updating the permission to 'owner'
    await drive.permissions.update({
      fileId: fileId,
      permissionId: file.data.permissions[0].id, // Use the first editor's permission ID
      requestBody: {
        role: 'owner',
        emailAddress: newOwnerEmail,
      },
    });

    console.log(`Ownership successfully transferred to ${newOwnerEmail}`);
  } catch (error) {
    console.error('Error transferring ownership:', error);
  }
}

// Main execution function
async function main() {
  const auth = await authorize();
  await transferOwnership(auth);
}

main(); 