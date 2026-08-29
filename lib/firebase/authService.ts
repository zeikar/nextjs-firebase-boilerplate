"use client";

/**
 * Authentication service for handling API requests to the server
 */

import { getErrorMessage } from "../utils/firebaseErrors";

export interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * The three outcomes of an account deletion, which are not interchangeable: a
 * refusal carries neither flag and says the account is still there,
 * `accountDeleted` says it is gone and only the cleanup behind it failed, and
 * `outcomeUnknown` says the request may have committed before its answer was
 * lost - `deleteUser` can succeed and the response still never arrive.
 *
 * The flags are the server's answer about the account, so whatever runs after
 * it - clearing the client session, refreshing the page - has to pass that
 * answer back unchanged. Returning the flagless shape for a failure of those
 * would claim the account is intact after the server said it was deleted.
 */
export interface DeleteAccountResult extends AuthResult {
  accountDeleted?: boolean;
  outcomeUnknown?: boolean;
}

/**
 * Sends the Firebase ID token to the server to set up session cookies
 */
export const sendTokenToServer = async (
  idToken: string
): Promise<AuthResult> => {
  try {
    const response = await fetch("/api/auth/signin", {
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

    return { success: true };
  } catch (error) {
    console.error("Server authentication error:", error);
    return {
      success: false,
      error: getErrorMessage(
        error,
        "An error occurred during server authentication."
      ),
    };
  }
};

/**
 * Sends a request to delete the session cookies on logout
 */
export const deleteSession = async (): Promise<AuthResult> => {
  try {
    const response = await fetch("/api/auth/signout", {
      method: "POST",
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to process sign out.");
    }

    return { success: true };
  } catch (error) {
    console.error("Session deletion error:", error);
    return {
      success: false,
      error: getErrorMessage(error, "An error occurred while signing out."),
    };
  }
};

/**
 * Sends a request to delete the user account (both client and server).
 * The ID token proves the caller still holds the account credential.
 */
export const deleteUserAccount = async (
  idToken: string
): Promise<DeleteAccountResult> => {
  try {
    const response = await fetch("/api/auth/user", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        // Only the server knows whether the account itself survived, so its
        // answer is passed through rather than flattened into a failure.
        ...(data.accountDeleted ? { accountDeleted: true } : {}),
        error: data.error || "Failed to delete account.",
      };
    }

    return { success: true };
  } catch (error) {
    // The request never produced an answer, so the account may be gone.
    console.error("Account deletion error:", error);
    return {
      success: false,
      outcomeUnknown: true,
      error: getErrorMessage(error, "An error occurred while deleting account."),
    };
  }
};
