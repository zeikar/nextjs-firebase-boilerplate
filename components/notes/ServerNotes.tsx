// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import {
  isTransientFirestoreError,
  MAX_NOTE_LENGTH,
  Note,
  userNotes,
} from "@/lib/firebase/notes";
import { ServerUser } from "@/lib/firebase/auth-server";
import NotesPanel from "./NotesPanel";

type ServerNotesProps = {
  user: ServerUser | null;
};

// Server component
export async function ServerNotes({ user }: ServerNotesProps) {
  if (!user) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Sign in to try this.
      </p>
    );
  }

  let notes: Note[];

  try {
    const snapshot = await userNotes(user.uid)
      .orderBy("createdAt", "desc")
      .get();

    notes = snapshot.docs.map((doc) => {
      const createdAt = doc.get("createdAt") as Timestamp;

      return {
        id: doc.id,
        // Not checked here: `app/api/notes/route.ts` is this collection's
        // only writer, and it rejects an empty or non-string `text` before
        // the write, so every document already has one. Unlike `createdAt`
        // below, a missing or wrong-typed `text` would not throw - it would
        // just render blank - so this cast leans entirely on that writer.
        text: doc.get("text") as string,
        createdAt: createdAt.toDate().toISOString(),
      };
    });
  } catch (error) {
    // An allow-list, not a deny-list: everything outside it - an
    // unprovisioned database, a broken service account, a `createdAt` that
    // isn't a `Timestamp` - is a configuration or programming fault that has
    // to surface, not sit behind a message that never changes.
    if (!isTransientFirestoreError(error)) throw error;

    console.error("Failed to load notes:", error);

    return (
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Notes are unavailable right now.
      </p>
    );
  }

  return <NotesPanel notes={notes} maxLength={MAX_NOTE_LENGTH} />;
}
