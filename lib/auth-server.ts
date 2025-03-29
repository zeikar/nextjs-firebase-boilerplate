import { cookies } from "next/headers";
import { adminAuth } from "./firebase-admin";

// Firebase session cookie name
const SESSION_COOKIE_NAME = "firebase-session";

export type ServerUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export async function getServerUser(): Promise<ServerUser | null> {
  try {
    // Get session cookie
    const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return null;
    }

    // Verify session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );

    // Get user information
    const user = await adminAuth.getUser(decodedClaims.uid);

    // Try to get user info from provider data if main properties are empty
    const providerData =
      user.providerData && user.providerData.length > 0
        ? user.providerData[0]
        : null;

    return {
      uid: user.uid,
      email: user.email || providerData?.email || "",
      displayName: user.displayName || providerData?.displayName || "",
      photoURL: user.photoURL || providerData?.photoURL || "",
    };
  } catch (error) {
    console.error("Server-side auth error:", error);
    return null;
  }
}
