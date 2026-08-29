"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@heroicons/react/24/outline";
import Loading from "../icons/Loading";
import { useNotification } from "@/contexts/notification-context";
import { getErrorMessage } from "@/lib/utils/firebaseErrors";
import type { Note } from "@/lib/firebase/notes";

type NotesPanelProps = {
  notes: Note[];
  maxLength: number;
};

// `createdAt` is an ISO string (always UTC). Slicing it directly instead of
// calling `toLocaleString()` keeps the server-rendered label identical to
// what the client re-renders regardless of either side's timezone - a
// locale-aware formatter would convert to whichever timezone it runs in,
// reintroducing exactly the hydration mismatch this avoids. The trailing
// "UTC" is a static string literal, not a conversion, for the same reason:
// it marks the label's timezone without depending on where it renders.
function formatCreatedAt(createdAt: string): string {
  return `${createdAt.slice(0, 16).replace("T", " ")} UTC`;
}

export default function NotesPanel({ notes, maxLength }: NotesPanelProps) {
  const router = useRouter();
  const { addErrorNotification } = useNotification();
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!text.trim()) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        addErrorNotification(data.error || "Failed to save the note.");
        return;
      }

      setText("");
      router.refresh();
    } catch (error) {
      console.error("Note creation error:", error);
      addErrorNotification(
        getErrorMessage(error, "An error occurred while saving the note.")
      );
    } finally {
      // Runs on every exit above, including the early return for a non-ok
      // response - not just the happy path - so a rejected save cannot leave
      // the submit button disabled forever.
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setPendingId(id);

    try {
      const response = await fetch("/api/notes", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        addErrorNotification(data.error || "Failed to delete the note.");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Note deletion error:", error);
      addErrorNotification(
        getErrorMessage(error, "An error occurred while deleting the note.")
      );
    } finally {
      // Same discipline as the submit handler: clears on every exit,
      // including the early return, so a rejected delete cannot leave that
      // row's spinner stuck forever.
      setPendingId(null);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="new-note-text" className="sr-only">
          New note
        </label>
        <input
          id="new-note-text"
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={maxLength}
          placeholder="Write a note..."
          className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/50"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 px-5 py-2 text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-300/50 disabled:opacity-70"
          disabled={isSaving}
        >
          {isSaving && <Loading size="small" color="blue" />}
          <span>Add</span>
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          No notes yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100 break-words">
                  {note.text}
                </p>
                <time
                  dateTime={note.createdAt}
                  className="text-xs text-gray-600 dark:text-gray-300"
                >
                  {formatCreatedAt(note.createdAt)}
                </time>
              </div>
              <button
                onClick={() => handleDelete(note.id)}
                disabled={pendingId === note.id}
                className="shrink-0 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-red-300/50 disabled:opacity-70"
              >
                <span className="sr-only">Delete note</span>
                {pendingId === note.id ? (
                  <Loading size="small" color="red" />
                ) : (
                  <TrashIcon className="h-4.5 w-4.5" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
