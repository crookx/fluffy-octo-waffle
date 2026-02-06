import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import fs from 'fs';
import path from 'path';

if (!getApps().length) {
  const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
  
  let serviceAccount;

  if (fs.existsSync(serviceAccountPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    } catch (error: any) {
      console.error('Error parsing serviceAccountKey.json:', error.message);
      throw new Error(
        'Could not initialize Firebase Admin SDK. The `serviceAccountKey.json` file appears to be malformed. Please ensure it is a valid JSON object.'
      );
    }
  } else {
    // If the file doesn't exist, throw a clear error and log the path.
    console.error(`Firebase Admin SDK Error: 'serviceAccountKey.json' was not found at path: ${serviceAccountPath}`);
    throw new Error(
      "Firebase Admin SDK Error: Could not find 'serviceAccountKey.json'. Please ensure the file exists in your project's root directory."
    );
  }
  
  if (!serviceAccount) {
      throw new Error('Firebase Admin SDK Error: Service account credentials could not be loaded.');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
