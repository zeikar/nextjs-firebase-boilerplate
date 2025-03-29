"use client";

import { useState } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  signInAnonymously as firebaseSignInAnonymously,
  UserCredential,
  linkWithPopup as firebaseLinkWithPopup,
  deleteUser as firebaseDeleteUser,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { useRouter } from "next/navigation";
import { AuthResult, sendTokenToServer, deleteSession, deleteUserAccount } from "./authService";

/**
 * Auth provider types for loading state management
 */
export type AuthProvider = "google" | "anonymous" | "signout" | "link" | "delete" | null;

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

  /**
   * Link anonymous account with Google account
   */
  const linkWithGoogle = async (): Promise<AuthResult> => {
    try {
      setLoadingProvider("link");
      
      // Check if user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }
      
      // Link with Google account
      const result = await firebaseLinkWithPopup(currentUser, googleProvider);
      
      // Get new ID token after linking
      const idToken = await result.user.getIdToken(true);
      
      // Send new token to server to update session
      const authResult = await sendTokenToServer(idToken);
      
      if (authResult.success) {
        router.refresh();
      }
      
      return authResult;
    } catch (error: any) {
      console.error("Account linking error:", error);
      return {
        success: false,
        error: error.message || "An error occurred while upgrading account.",
      };
    } finally {
      setLoadingProvider(null);
    }
  };
  
  /**
   * Delete user account - both on client and server
   * Uses a two-step process:
   * 1. Call server to verify session and delete user on server
   * 2. Then try to delete on client if needed
   */
  const deleteAccount = async (): Promise<AuthResult> => {
    try {
      setLoadingProvider("delete");
      
      // First, call the server to delete the account
      // This ensures we have a valid session and deletes the user on the server
      const serverResult = await deleteUserAccount();
      
      if (!serverResult.success) {
        throw new Error(serverResult.error || "Failed to delete account on server");
      }
      
      try {
        // Try to delete client-side user as well, if it exists
        // This might fail if server already deleted user, which is fine
        const currentUser = auth.currentUser;
        if (currentUser) {
          await firebaseDeleteUser(currentUser);
        }
      } catch (clientError) {
        // Ignore client-side errors as server already deleted the account
        console.log("Client-side deletion not needed or failed:", clientError);
      }
      
      // Refresh the page to reflect changes
      router.refresh();
      
      return { success: true };
    } catch (error: any) {
      console.error("Account deletion error:", error);
      return {
        success: false,
        error: error.message || "An error occurred while deleting account.",
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
    linkWithGoogle,
    deleteAccount,
  };
}
