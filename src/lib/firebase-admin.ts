import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import fs from 'fs';
import path from 'path';

console.log('--- Loading Firebase Admin SDK ---');

if (!getApps().length) {
  console.log('Firebase Admin SDK not initialized. Initializing...');
  const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
  console.log(`Looking for service account key at: ${serviceAccountPath}`);
  
  let serviceAccount;

  if (fs.existsSync(serviceAccountPath)) {
    console.log('Found serviceAccountKey.json. Reading file...');
    try {
      const fileContents = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(fileContents);
      console.log('Successfully parsed serviceAccountKey.json.');
    } catch (error: any) {
      console.error('Error parsing serviceAccountKey.json:', error.message);
      throw new Error(
        'Could not initialize Firebase Admin SDK. The `serviceAccountKey.json` file appears to be malformed. Please ensure it is a valid JSON object.'
      );
    }
  } else {
    console.error(`Firebase Admin SDK Error: 'serviceAccountKey.json' was not found at path: ${serviceAccountPath}`);
    throw new Error(
      "Firebase Admin SDK Error: Could not find 'serviceAccountKey.json'. Please ensure the file exists in your project's root directory."
    );
  }
  
  if (!serviceAccount || !serviceAccount.project_id) {
      console.error('Service account is missing or does not have a project_id.');
      throw new Error('Firebase Admin SDK Error: Service account credentials could not be loaded or are missing `project_id`.');
  }

  console.log(`Initializing with Project ID: ${serviceAccount.project_id}`);

  // Automatically determine the storage bucket if not provided in environment variables
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`;
  console.log(`Using storage bucket: ${storageBucket}`);

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: storageBucket,
    });
    console.log('--- Firebase Admin SDK Initialized Successfully ---');
  } catch (e: any) {
    console.error('--- Firebase Admin SDK Initialization FAILED ---');
    console.error(e);
    throw new Error(`Failed to initialize Firebase Admin SDK: ${e.message}`);
  }

} else {
    console.log('Firebase Admin SDK already initialized.');
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
