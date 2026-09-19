import { createRequire } from 'module';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const require = createRequire(import.meta.url);
const serviceAccount = require('./uploads/serviceAccountKey.json');

import dotenv from 'dotenv';
dotenv.config();

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'solveit-f4557.appspot.com',
});

export const db = getFirestore();
export const bucket = getStorage().bucket();
