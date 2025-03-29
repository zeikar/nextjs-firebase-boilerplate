"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase client configuration
export const firebaseClientConfig = process.env
  .NEXT_PUBLIC_FIREBASE_WEB_SDK_CONFIG
  ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_WEB_SDK_CONFIG)
  : null;

// Initialize Firebase app (prevent duplicate initialization)
const app = !getApps().length
  ? initializeApp(firebaseClientConfig)
  : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
