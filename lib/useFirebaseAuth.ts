"use client";

import { useState } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  signInAnonymously as firebaseSignInAnonymously,
  UserCredential,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { useRouter } from "next/navigation";
import { AuthResult, sendTokenToServer, deleteSession } from "./authService";

/**
 * Auth provider types for loading state management
 */
export type AuthProvider = "google" | "anonymous" | "signout" | null;

export function useFirebaseAuth() {
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider>(null);

  /**
   * Handles the common authentication flow with the server
   */
  const processServerAuth = async (
    credentialPromise: Promise<UserCredential>,
    operation: string,
    provider: AuthProvider
  ): Promise<AuthResult> => {
    try {
      setLoadingProvider(provider);
      // Process user authentication
      const result = await credentialPromise;
      // Get Firebase ID token
      const idToken = await result.user.getIdToken();

      // Send ID token to server to set session cookie
      const authResult = await sendTokenToServer(idToken);

      if (authResult.success) {
        router.refresh();
      }

      return authResult;
    } catch (error: any) {
      console.error(`${operation} error:`, error);
      return {
        success: false,
        error: error.message || `An error occurred during ${operation}.`,
      };
    } finally {
      setLoadingProvider(null);
    }
  };

  /**
   * Sign in with Google
   */
  const signInWithGoogle = async (): Promise<AuthResult> => {
    return processServerAuth(
      signInWithPopup(auth, googleProvider),
      "Google sign in",
      "google"
    );
  };

  /**
   * Sign in anonymously
   */
  const signInAnonymously = async (): Promise<AuthResult> => {
    return processServerAuth(
      firebaseSignInAnonymously(auth),
      "Anonymous sign in",
      "anonymous"
    );
  };

  /**
   * Sign out user
   */
  const signOut = async (): Promise<AuthResult> => {
    try {
      setLoadingProvider("signout");

      // Sign out from Firebase client
      await firebaseSignOut(auth);

      // Delete server session
      const sessionResult = await deleteSession();

      if (sessionResult.success) {
        router.refresh();
      }

      return sessionResult;
    } catch (error: any) {
      console.error("Sign out error:", error);
      return {
        success: false,
        error: error.message || "An error occurred during sign out.",
      };
    } finally {
      setLoadingProvider(null);
    }
  };

  return {
    loadingProvider,
    isAuthLoading: loadingProvider !== null,
    signInWithGoogle,
    signInAnonymously,
    signOut,
  };
}
