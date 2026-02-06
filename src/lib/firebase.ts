'use client';

import {initializeApp, getApp, getApps, FirebaseApp} from 'firebase/app';
import {getAuth, Auth} from 'firebase/auth';
import {getFirestore, Firestore} from 'firebase/firestore';
import { getAnalytics, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDETO0ohxe5Hmu5XBoWwZrnGbLNQ5fYdTk",
  authDomain: "kenya-land-trust.firebaseapp.com",
  projectId: "kenya-land-trust",
  storageBucket: "kenya-land-trust.appspot.com",
  messagingSenderId: "390036863335",
  appId: "1:390036863335:web:295ecb4c46f298aa5597c2",
  measurementId: "G-8TEKGJSJD1"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | undefined = undefined;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} else {
  app = getApp();
  if (typeof window !== 'undefined') {
     analytics = getAnalytics(app);
  }
}
auth = getAuth(app);
db = getFirestore(app);

export {app, auth, db, analytics};
