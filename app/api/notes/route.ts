import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getServerSession } from "@/lib/firebase/auth-server";
import { MAX_NOTE_LENGTH, userNotes } from "@/lib/firebase/notes";
import { rejectCrossSiteRequest } from "@/lib/utils/request-origin";

// The uid behind every `userNotes(uid)` call below always comes from here,
// never from the request body - that binding is what makes the notes
// subcollection private to its owner.
async function resolveUid(): Promise<string | NextResponse> {
  const session = await getServerSession();

  if (session.state === "unavailable") {
    // Firebase could not answer, so "not signed in" would be a lie.
    return NextResponse.json(
      { success: false, error: "Authentication is unavailable." },
      { status: 503 }
    );
  }

  if (session.state === "invalid") {
    return NextResponse.json(
      { success: false, error: "No authenticated user found." },
      { status: 401 }
    );
  }

  return session.user.uid;
}

// Create a note
export async function POST(request: NextRequest) {
  const rejected = rejectCrossSiteRequest(request, true);
  if (rejected) {
    return rejected;
  }

  const uid = await resolveUid();
  if (typeof uid !== "string") {
    return uid;
  }

  // Only `text` is read; a `uid` in the body would be ignored either way,
  // since the path above never uses anything but the session's own uid.
  const body = await request.json().catch(() => null);
  const text = typeof (body as { text?: unknown })?.text === "string"
    ? (body as { text: string }).text
    : null;

  const trimmed = text?.trim() ?? "";

  if (!trimmed || trimmed.length > MAX_NOTE_LENGTH) {
    return NextResponse.json(
      {
        success: false,
        error: `Note must be between 1 and ${MAX_NOTE_LENGTH} characters.`,
      },
      { status: 400 }
    );
  }

  try {
    await userNotes(uid).add({
      text: trimmed,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Note creation error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to save the note." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

// Delete a note
export async function DELETE(request: NextRequest) {
  const rejected = rejectCrossSiteRequest(request, true);
  if (rejected) {
    return rejected;
  }

  const uid = await resolveUid();
  if (typeof uid !== "string") {
    return uid;
  }

  const body = await request.json().catch(() => null);
  const id = (body as { id?: unknown })?.id;

  // A `/` would let the id address a different document path entirely, so it
  // is rejected alongside the non-string and empty cases.
  if (typeof id !== "string" || !id || id.includes("/")) {
    return NextResponse.json(
      { success: false, error: "Invalid note id." },
      { status: 400 }
    );
  }

  try {
    await userNotes(uid).doc(id).delete();
  } catch (error) {
    console.error("Note deletion error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to delete the note." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
