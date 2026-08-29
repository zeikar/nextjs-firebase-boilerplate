import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getSessionUid } from "@/lib/firebase/auth-server";
import {
  SESSION_COOKIE_NAME,
  SESSION_EXPIRES_IN,
  isRecent,
} from "@/lib/firebase/session";
import { rejectCrossSiteRequest } from "@/lib/utils/request-origin";

// Sign In API handler
export async function POST(request: NextRequest) {
  // Login CSRF: without an origin check a cross-site form post can hand the
  // victim a session cookie for an account the attacker controls.
  const rejected = rejectCrossSiteRequest(request, true);
  if (rejected) {
    return rejected;
  }

  try {
    // Extract ID token from request body
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "ID token is required." },
        { status: 400 }
      );
    }

    // Verify ID token using Firebase Admin SDK, rejecting revoked tokens
    const decodedToken = await adminAuth.verifyIdToken(idToken, true);

    // A two week session must come from a sign-in that just happened, so a
    // stolen ID token cannot be traded up for a long-lived session. Re-minting
    // for a uid that already holds a valid session (the anonymous -> Google
    // upgrade refreshes its cookie) grants no new access, so it is exempt.
    if (
      !isRecent(decodedToken.auth_time) &&
      (await getSessionUid()) !== decodedToken.uid
    ) {
      return NextResponse.json(
        { success: false, error: "Recent sign-in required." },
        { status: 401 }
      );
    }

    // Create session cookie (valid for 2 weeks)
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN,
    });

    // Set cookie
    (await cookies()).set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      maxAge: SESSION_EXPIRES_IN / 1000, // Convert to seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ success: true, uid: decodedToken.uid });
  } catch (error) {
    console.error("Sign in error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed." },
      { status: 401 }
    );
  }
}
