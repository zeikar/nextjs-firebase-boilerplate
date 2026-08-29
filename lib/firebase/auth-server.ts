// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "./admin";
import { SESSION_COOKIE_NAME } from "./session";
import { isRejectedCredentialError } from "../utils/firebaseErrors";

export type ServerUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
};

/**
 * A missing or rejected cookie is the caller's problem and can be cleared,
 * while a Firebase outage must not be reported as "signed out" - the two need
 * different answers, so they are kept apart here.
 */
export type ServerSession =
  | { state: "valid"; user: ServerUser }
  | { state: "invalid" }
  | { state: "unavailable" };

export async function getServerSession(): Promise<ServerSession> {
  // Get session cookie
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return { state: "invalid" };
  }

  try {
    // Verify session cookie
    const claims = await adminAuth.verifySessionCookie(sessionCookie, true);

    // The cookie carries the profile Firebase minted it from, so the user
    // record does not have to be fetched again - `verifySessionCookie` already
    // reads it once to check for revocation. The claims are refreshed whenever
    // the cookie is re-minted (sign-in, anonymous account upgrade).
    return {
      state: "valid",
      user: {
        uid: claims.uid,
        email: claims.email ?? null,
        displayName: typeof claims.name === "string" ? claims.name : null,
        photoURL: claims.picture ?? null,
        isAnonymous: claims.firebase.sign_in_provider === "anonymous",
      },
    };
  } catch (error) {
    console.error("Server-side auth error:", error);

    return { state: isRejectedCredentialError(error) ? "invalid" : "unavailable" };
  }
}

/**
 * The current user, or null when there is nobody to render - for pages, which
 * have to show something either way.
 */
export async function getServerUser(): Promise<ServerUser | null> {
  const session = await getServerSession();

  return session.state === "valid" ? session.user : null;
}

/**
 * The uid behind the current session cookie, for callers that only need to
 * know whether this browser already holds a session for a given user.
 */
export async function getSessionUid(): Promise<string | null> {
  const session = await getServerSession();

  return session.state === "valid" ? session.user.uid : null;
}
