// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Service Account (for server-side)
function loadServiceAccount(): ServiceAccount {
  const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    throw new Error(
      "FIREBASE_ADMIN_SERVICE_ACCOUNT is not set. Copy .env.local.example to .env.local and fill it with your Firebase service account JSON."
    );
  }

  try {
    return JSON.parse(serviceAccount);
  } catch {
    // The usual cause is the line breaks of a pasted private_key.
    throw new Error(
      "FIREBASE_ADMIN_SERVICE_ACCOUNT is not valid JSON. The whole service account JSON has to be on a single line."
    );
  }
}

// Initialize Admin SDK, reusing the app that survives a hot reload
const adminApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert(loadServiceAccount()),
      });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
