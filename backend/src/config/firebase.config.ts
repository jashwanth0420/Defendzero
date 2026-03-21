import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');
    
    // Check if file exists locally (Best for development)
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized via local JSON file.');
    } 
    // Fallback to ENV string (Best for production like Vercel/Render)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized via ENV string.');
    } else {
      console.warn('⚠️ No Firebase credentials found. Falling back to default/mock init.');
      admin.initializeApp();
    }
  } catch (err: any) {
    console.error('❌ Firebase Init Error:', err.message);
  }
}

export const firebaseAdmin = admin;
