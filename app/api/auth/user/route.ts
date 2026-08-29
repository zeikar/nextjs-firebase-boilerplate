import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getServerSession } from "@/lib/firebase/auth-server";
import { SESSION_COOKIE_NAME, isRecent } from "@/lib/firebase/session";
import { isRejectedCredentialError } from "@/lib/utils/firebaseErrors";
import { rejectCrossSiteRequest } from "@/lib/utils/request-origin";

// Get current authenticated user information
export async function GET() {
  const session = await getServerSession();

  if (session.state === "unavailable") {
    // Firebase could not answer, so "not signed in" would be a lie.
    return NextResponse.json(
      { success: false, user: null, error: "Authentication is unavailable." },
      { status: 503 }
    );
  }

  if (session.state === "invalid") {
    // The cookie cannot authenticate anyone; stop sending it back.
    (await cookies()).delete(SESSION_COOKIE_NAME);

    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    user: session.user,
  });
}

// Delete user account API handler
export async function DELETE(request: NextRequest) {
  const rejected = rejectCrossSiteRequest(request, true);
  if (rejected) {
    return rejected;
  }

  const cookieStore = await cookies();

  // Get session information from cookie
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return NextResponse.json(
      { success: false, error: "No authenticated user found." },
      { status: 401 }
    );
  }

  // Admin deletion bypasses Firebase's client-side `requires-recent-login`
  // rule, so the caller must also prove it still holds the account credential:
  // a session cookie alone may be two weeks old and merely copied.
  const body = await request.json().catch(() => null);
  const idToken =
    typeof (body as { idToken?: unknown })?.idToken === "string"
      ? (body as { idToken: string }).idToken
      : null;

  if (!idToken) {
    return NextResponse.json(
      { success: false, error: "Re-authentication is required." },
      { status: 401 }
    );
  }

  let uid: string;

  try {
    // Verify session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );

    // Get the user UID from decoded claims
    uid = decodedClaims.uid;

    const decodedToken = await adminAuth.verifyIdToken(idToken, true);

    if (decodedToken.uid !== uid) {
      return NextResponse.json(
        { success: false, error: "Re-authentication is required." },
        { status: 403 }
      );
    }

    // Anonymous users have no credential to re-authenticate with, so their
    // proof is a just-issued token (`getIdToken(true)`) instead of a fresh
    // sign-in - otherwise an hour-old copied token would be accepted.
    const isAnonymous = decodedToken.firebase?.sign_in_provider === "anonymous";
    const provenRecently = isAnonymous
      ? isRecent(decodedToken.iat)
      : isRecent(decodedToken.auth_time);

    if (!provenRecently) {
      return NextResponse.json(
        { success: false, error: "Re-authentication is required." },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Account deletion authentication error:", error);

    // An expired or revoked credential is the caller's problem, not a server
    // fault, and the Admin SDK's message must not reach the client. A backend
    // failure keeps the session: the credential may well still be good.
    if (isRejectedCredentialError(error)) {
      // Delete session cookie
      cookieStore.delete(SESSION_COOKIE_NAME);

      return NextResponse.json(
        { success: false, error: "Re-authentication is required." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete account." },
      { status: 500 }
    );
  }

  try {
    // Delete the user from Firebase Auth
    await adminAuth.deleteUser(uid);
  } catch (error) {
    // The account is still there, so the session cookie stays valid too.
    console.error("Account deletion error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to delete account." },
      { status: 500 }
    );
  }

  // Delete session cookie
  cookieStore.delete(SESSION_COOKIE_NAME);

  return NextResponse.json({ success: true });
}
