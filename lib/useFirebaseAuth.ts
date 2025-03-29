"use client";

import { useState } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { useRouter } from "next/navigation";

interface AuthResult {
  success: boolean;
  error?: string;
}

export function useFirebaseAuth() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(false);

  // Google sign in
  const signInWithGoogle = async (): Promise<AuthResult> => {
    try {
      setAuthLoading(true);
      // Sign in with Google using popup method
      const result = await signInWithPopup(auth, googleProvider);
      // Get Firebase ID token
      const idToken = await result.user.getIdToken();

      // Send ID token to server to set session cookie
      const response = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Server authentication failed.");
      }

      router.refresh();
      return { success: true };
    } catch (error: any) {
      console.error("Google sign in error:", error);
      return {
        success: false,
        error: error.message || "An error occurred during sign in.",
      };
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out
  const signOut = async (): Promise<AuthResult> => {
    try {
      setAuthLoading(true);

      // Firebase client sign out
      await firebaseSignOut(auth);

      // Delete server session
      const response = await fetch("/api/auth/firebase", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to process sign out.");
      }

      router.refresh();
      return { success: true };
    } catch (error: any) {
      console.error("Sign out error:", error);
      return {
        success: false,
        error: error.message || "An error occurred during sign out.",
      };
    } finally {
      setAuthLoading(false);
    }
  };

  return {
    loading: authLoading,
    signInWithGoogle,
    signOut,
  };
}
