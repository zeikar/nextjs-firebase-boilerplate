"use client";

import { useState } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  signInAnonymously as firebaseSignInAnonymously,
  UserCredential,
  linkWithPopup as firebaseLinkWithPopup,
  reauthenticateWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "./client";
import { useRouter } from "next/navigation";
import {
  AuthResult,
  sendTokenToServer,
  deleteSession,
  deleteUserAccount,
} from "./authService";
import { useFirebaseErrorHandler } from "../utils/useFirebaseErrorHandler";
import { getErrorMessage } from "../utils/firebaseErrors";

/**
 * The auth operations that can be in flight, for loading state management
 */
export type AuthOperation =
  | "google"
  | "anonymous"
  | "signout"
  | "link"
  | "delete"
  | null;

/**
 * The app's auth operations and their shared loading state.
 * Instantiate it once through `AuthProvider`; components read it with
 * `useAuth()` so a running operation blocks the others.
 */
export function useFirebaseAuth() {
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<AuthOperation>(null);
  const {
    showFirebaseError,
    showErrorMessage,
    showSuccessMessage,
    showWarningMessage,
  } = useFirebaseErrorHandler();

  /**
   * Handles the common authentication flow with the server
   */
  const processServerAuth = async (
    credentialPromise: Promise<UserCredential>,
    operation: string,
    provider: AuthOperation
  ): Promise<AuthResult> => {
    try {
      setLoadingProvider(provider);
      // Process user authentication
      const result = await credentialPromise;
      // Get Firebase ID token
      const idToken = await result.user.getIdToken();

      // Send ID token to server to set session cookie
      const authResult = await sendTokenToServer(idToken);

      if (!authResult.success) {
        // The server holds no session for this sign-in, so the client must not
        // keep one either - otherwise the two disagree about who is signed in.
        await firebaseSignOut(auth);
        showErrorMessage(
          authResult.error || `An error occurred during ${operation}.`
        );
        return authResult;
      }

      router.refresh();
      showSuccessMessage("Successfully signed in.");

      return authResult;
    } catch (error) {
      console.error(`${operation} error:`, error);
      showFirebaseError(error, `An error occurred during ${operation}.`);
      return {
        success: false,
        error: getErrorMessage(error, `An error occurred during ${operation}.`),
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

      // Both sides are cleared independently: if one fails the other still has
      // to happen, or client and server disagree about who is signed in.
      const [clientOutcome, sessionOutcome] = await Promise.allSettled([
        firebaseSignOut(auth),
        deleteSession(),
      ]);

      // The server session is gone or unusable either way, so the
      // server-rendered page has to be refreshed.
      router.refresh();

      if (clientOutcome.status === "rejected") {
        const error = clientOutcome.reason;
        console.error("Sign out error:", error);
        showFirebaseError(error, "An error occurred while signing out.");
        return {
          success: false,
          error: getErrorMessage(error, "An error occurred during sign out."),
        };
      }

      const sessionResult =
        sessionOutcome.status === "fulfilled"
          ? sessionOutcome.value
          : {
              success: false,
              error: "An error occurred during sign out.",
            };

      if (!sessionResult.success) {
        // Signed out here, but the session may still be alive elsewhere.
        showWarningMessage(
          sessionResult.error || "The server session could not be revoked."
        );
        return sessionResult;
      }

      showSuccessMessage("Successfully signed out.");

      return sessionResult;
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

      // The account is linked at this point whatever the server answers, and
      // the existing session cookie still covers the same uid.
      router.refresh();

      if (authResult.success) {
        showSuccessMessage("Account successfully linked.");
      } else {
        showWarningMessage(
          authResult.error || "Account linked, but the session was not updated."
        );
      }

      return authResult;
    } catch (error) {
      console.error("Account linking error:", error);
      showFirebaseError(error, "An error occurred while linking account.");
      return {
        success: false,
        error: getErrorMessage(
          error,
          "An error occurred while upgrading account."
        ),
      };
    } finally {
      setLoadingProvider(null);
    }
  };

  /**
   * Delete user account - both on client and server
   * Server-side deletion bypasses Firebase's `requires-recent-login` rule, so
   * the user re-authenticates first and the fresh ID token is sent as proof.
   */
  const deleteAccount = async (): Promise<AuthResult> => {
    try {
      setLoadingProvider("delete");

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }

      // Anonymous users have no credential to re-authenticate with; their live
      // ID token is the strongest proof available.
      if (!currentUser.isAnonymous) {
        await reauthenticateWithPopup(currentUser, googleProvider);
      }
      const idToken = await currentUser.getIdToken(true);

      const serverResult = await deleteUserAccount(idToken);

      if (!serverResult.success) {
        throw new Error(
          serverResult.error || "Failed to delete account on server"
        );
      }

      // The account no longer exists, so drop the client session as well.
      await firebaseSignOut(auth);

      // Refresh the page to reflect changes
      router.refresh();
      showSuccessMessage("Account successfully deleted.");

      return { success: true };
    } catch (error) {
      console.error("Account deletion error:", error);
      showFirebaseError(error, "An error occurred while deleting account.");
      return {
        success: false,
        error: getErrorMessage(
          error,
          "An error occurred while deleting account."
        ),
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
