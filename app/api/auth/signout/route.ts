import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Firebase session cookie name
const SESSION_COOKIE_NAME = "firebase-session";

// Sign out API handler
export async function POST() {
  try {
    // Delete session cookie
    (await cookies()).delete(SESSION_COOKIE_NAME);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.json(
      { success: false, error: "Sign out failed." },
      { status: 500 }
    );
  }
}