import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/session";
import { isRejectedCredentialError } from "@/lib/utils/firebaseErrors";
import { rejectCrossSiteRequest } from "@/lib/utils/request-origin";

// The cookie is gone from this browser either way, but the session lives on
// elsewhere until it is revoked, so the caller has to hear about a failure.
function revocationFailed() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Signed out on this device, but the server session could not be revoked.",
    },
    { status: 500 }
  );
}

// Sign out API handler
export async function POST(request: NextRequest) {
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) {
    return rejected;
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // Delete session cookie
  cookieStore.delete(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return NextResponse.json({ success: true });
  }

  let uid: string;
  let authTime: number;

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    uid = decodedClaims.uid;
    authTime = decodedClaims.auth_time;
  } catch (error) {
    console.error("Sign out verification error:", error);

    // A cookie Firebase actually rejects is already unusable, so there is
    // nothing left to revoke. An outage or a misconfigured service account is
    // a real failure and must not be reported as a completed sign-out.
    if (isRejectedCredentialError(error)) {
      return NextResponse.json({ success: true });
    }

    return revocationFailed();
  }

  try {
    // Revocation only rejects tokens whose `auth_time` is strictly before the
    // second it happened, so signing out within the same second as signing in
    // would leave the cookie working. Wait that second out (under 1s, and only
    // in that race).
    const revokableFrom = (authTime + 1) * 1000;
    const wait = revokableFrom - Date.now();
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }

    // Firebase cannot revoke a single session cookie, so signing out revokes
    // the refresh tokens - every session of this user, on every device, is
    // then rejected by the `checkRevoked` verification. Only deleting the
    // cookie would leave a copied one usable for the remaining two weeks.
    await adminAuth.revokeRefreshTokens(uid);
  } catch (error) {
    console.error("Sign out revocation error:", error);
    return revocationFailed();
  }

  return NextResponse.json({ success: true });
}
