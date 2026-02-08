import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import fs from 'fs';
import path from 'path';

console.log('--- Loading Firebase Admin SDK ---');

if (!getApps().length) {
  console.log('Firebase Admin SDK not initialized. Initializing...');

  // Try multiple env var strategies so deployments are flexible:
  // 1) FIREBASE_SERVICE_ACCOUNT_KEY_B64 (base64 of the full JSON) - recommended for Vercel
  // 2) FIREBASE_SERVICE_ACCOUNT_KEY (minified JSON string)
  // 3) FIREBASE_SERVICE_ACCOUNT (alternate name some users used)
  // 4) Individual FIREBASE_* vars (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY)
  // 5) Local file `serviceAccountKey.json` (development only)

  let serviceAccount: any | undefined;

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64 || process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (b64) {
    try {
      serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      console.log('Loaded service account from FIREBASE_SERVICE_ACCOUNT_KEY_B64/FIREBASE_SERVICE_ACCOUNT_B64');
    } catch (err: any) {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY_B64: will skip this value', err.message || err);
      serviceAccount = undefined;
    }
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount && raw) {
    try {
      serviceAccount = JSON.parse(raw);
      console.log('Loaded service account from FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT');
    } catch (err: any) {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY/FIREBASE_SERVICE_ACCOUNT: will skip this value', err.message || err);
      serviceAccount = undefined;
    }
  }

  // Individual fields (useful if private key is stored with \n escapes)
  if (!serviceAccount && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      serviceAccount = {
        type: process.env.FIREBASE_TYPE || 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      };
      console.log('Loaded service account from individual FIREBASE_* environment variables');
    } catch (err: any) {
      console.error('Error building service account from individual env vars:', err.message || err);
      throw err;
    }
  }

  // Local development fallback
  if (!serviceAccount) {
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    console.log(`Looking for service account key at: ${serviceAccountPath}`);
    if (fs.existsSync(serviceAccountPath)) {
      try {
        const fileContents = fs.readFileSync(serviceAccountPath, 'utf8');
        serviceAccount = JSON.parse(fileContents);
        console.log('Successfully parsed local serviceAccountKey.json.');
      } catch (error: any) {
        console.error('Error parsing local serviceAccountKey.json:', error.message);
        throw new Error('Could not initialize Firebase Admin SDK. Local serviceAccountKey.json appears malformed.');
      }
    }
  }

  if (!serviceAccount || !serviceAccount.project_id) {
    console.error('Service account was not provided via env vars or local file.');
    throw new Error('Firebase Admin SDK Error: service account not provided. Set FIREBASE_SERVICE_ACCOUNT_KEY_B64 or FIREBASE_SERVICE_ACCOUNT_KEY (or provide serviceAccountKey.json locally).');
  }

  console.log(`Initializing with Project ID: ${serviceAccount.project_id}`);
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`;
  console.log(`Using storage bucket: ${storageBucket}`);

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket,
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
