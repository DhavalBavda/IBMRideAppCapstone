import admin from 'firebase-admin';
import fs from 'fs';

// Load the Firebase Admin SDK from the file.
const serviceAccount = JSON.parse(fs.readFileSync("service-account.json", "utf8"));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;