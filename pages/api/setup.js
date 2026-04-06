// lib/firebase.js
// Fricoin Bot — Firebase Admin SDK
// The Palace, Inc.

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY || '';

  // Handle all formats Vercel might store the key in
  if (key.includes('\\n')) {
    return key.replace(/\\n/g, '\n');
  }
  return key;
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      privateKey:  getPrivateKey(),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const db = getFirestore();
export default db;
