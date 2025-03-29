import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase Service Account (for server-side)
const firebaseServiceAccount: { [key: string]: string } | null = process.env
  .FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

// Firebase client configuration
export const firebaseClientConfig = {
  apiKey: process.env.FIREBASE_WEB_API_KEY,
  projectId: firebaseServiceAccount?.project_id,
  authDomain: `${firebaseServiceAccount?.project_id}.firebaseapp.com`,
  storageBucket: `${firebaseServiceAccount?.project_id}.appspot.com`,
};

// Initialize Firebase app (prevent duplicate initialization)
const app = !getApps().length
  ? initializeApp(firebaseClientConfig)
  : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
