"use client";

/**
 * Authentication service for handling API requests to the server
 */

export interface AuthResult {
  success: boolean;
  error?: string;
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
  } catch (error: any) {
    console.error("Server authentication error:", error);
    return {
      success: false,
      error: error.message || "An error occurred during server authentication.",
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
  } catch (error: any) {
    console.error("Session deletion error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while signing out.",
    };
  }
};

/**
 * Sends a request to delete the user account (both client and server)
 */
export const deleteUserAccount = async (): Promise<AuthResult> => {
  try {
    const response = await fetch("/api/auth/user", {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to delete account.");
    }

    return { success: true };
  } catch (error: any) {
    console.error("Account deletion error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while deleting account.",
    };
  }
};
