import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getServerUser } from "@/lib/firebase/auth-server";

// Firebase session cookie name
const SESSION_COOKIE_NAME = "firebase-session";

// Get current authenticated user information
export async function GET() {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Session verification error:", error);
    // Delete cookie
    (await cookies()).delete(SESSION_COOKIE_NAME);

    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }
}

// Delete user account API handler
export async function DELETE() {
  try {
    // Get session information from cookie
    const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: "No authenticated user found." },
        { status: 401 }
      );
    }

    // Verify session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );

    // Get the user UID from decoded claims
    const uid = decodedClaims.uid;

    // Delete the user from Firebase Auth
    await adminAuth.deleteUser(uid);

    // Delete session cookie
    (await cookies()).delete(SESSION_COOKIE_NAME);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Account deletion error:", error);

    // Delete session cookie in case of errors to prevent authentication issues
    (await cookies()).delete(SESSION_COOKIE_NAME);

    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete account." },
      { status: 500 }
    );
  }
}
