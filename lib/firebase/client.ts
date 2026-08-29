"use client";

import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase client configuration
function loadClientConfig(): FirebaseOptions {
  const clientConfig = process.env.NEXT_PUBLIC_FIREBASE_WEB_SDK_CONFIG;

  if (!clientConfig) {
    throw new Error(
      "NEXT_PUBLIC_FIREBASE_WEB_SDK_CONFIG is not set. Copy .env.local.example to .env.local and fill it with your Firebase web app config."
    );
  }

  try {
    return JSON.parse(clientConfig);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_FIREBASE_WEB_SDK_CONFIG is not valid JSON. The whole config object has to be on a single line."
    );
  }
}

// Initialize Firebase app (prevent duplicate initialization)
const app = getApps().length ? getApp() : initializeApp(loadClientConfig());
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
