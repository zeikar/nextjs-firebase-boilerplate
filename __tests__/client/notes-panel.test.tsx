/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NotesPanel from "@/components/notes/NotesPanel";
import type { Note } from "@/lib/firebase/notes";
import "./setup";

// `lib/firebase/notes.ts` is marked `server-only` and pulls in the Firebase
// Admin SDK at import time, so its `MAX_NOTE_LENGTH` cannot be imported into
// this jsdom test (the type-only `Note` import above is erased at compile
// time and carries no such risk). This is simply the value handed to
// `NotesPanel` as its `maxLength` prop below - the component just forwards
// whatever number it receives, so the value itself does not matter here.
// The production cap is checked against the real `MAX_NOTE_LENGTH` in
// `__tests__/api/notes.test.ts`.
const MAX_NOTE_LENGTH = 200;

const router = vi.hoisted(() => ({
  refresh: vi.fn(),
}));
const notification = vi.hoisted(() => ({
  addErrorNotification: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));
vi.mock("@/contexts/notification-context", () => ({
  useNotification: () => notification,
}));

const fetchMock = vi.fn();

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body };
}

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: "note-1",
    text: "first note",
    createdAt: "2026-08-29T12:34:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  router.refresh.mockReset();
  notification.addErrorNotification.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("rendering", () => {
  it("shows each note's text in the order given", () => {
    render(
      <NotesPanel
        notes={[note({ id: "a", text: "first" }), note({ id: "b", text: "second" })]}
        maxLength={MAX_NOTE_LENGTH}
      />
    );

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("first");
    expect(items[1]).toHaveTextContent("second");
  });

  it("shows the empty state when there are no notes", () => {
    render(<NotesPanel notes={[]} maxLength={MAX_NOTE_LENGTH} />);

    expect(screen.getByText("No notes yet.")).toBeInTheDocument();
  });
});

describe("adding a note", () => {
  it("posts the text, clears the input, and refreshes on success", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    render(<NotesPanel notes={[]} maxLength={MAX_NOTE_LENGTH} />);

    const input = screen.getByLabelText("New note");
    await userEvent.type(input, "buy milk");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "buy milk" }),
    });
    expect(input).toHaveValue("");
  });

  it("sends no request for whitespace-only text", async () => {
    render(<NotesPanel notes={[]} maxLength={MAX_NOTE_LENGTH} />);

    await userEvent.type(screen.getByLabelText("New note"), "   ");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces the server's validation message and does not refresh", async () => {
    // The route's real 400 body for POST - the one an over-length note
    // actually gets back - not a made-up message.
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          success: false,
          error: `Note must be between 1 and ${MAX_NOTE_LENGTH} characters.`,
        },
        false
      )
    );
    render(<NotesPanel notes={[]} maxLength={MAX_NOTE_LENGTH} />);

    await userEvent.type(screen.getByLabelText("New note"), "buy milk");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() =>
      expect(notification.addErrorNotification).toHaveBeenCalledWith(
        `Note must be between 1 and ${MAX_NOTE_LENGTH} characters.`
      )
    );
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it("shows a generic message and leaves the submit button enabled again when the request itself fails", async () => {
    fetchMock.mockRejectedValue(new Error(""));
    render(<NotesPanel notes={[]} maxLength={MAX_NOTE_LENGTH} />);

    await userEvent.type(screen.getByLabelText("New note"), "buy milk");
    const submit = screen.getByRole("button", { name: "Add" });
    await userEvent.click(submit);

    await waitFor(() =>
      expect(notification.addErrorNotification).toHaveBeenCalledWith(
        "An error occurred while saving the note."
      )
    );
    expect(router.refresh).not.toHaveBeenCalled();
    // The point of the whole test: a network blip must not brick the form.
    // `isSaving` is cleared in a `finally` so the button comes back and the
    // user can retry - move that reset onto the success path and this fails.
    expect(submit).toBeEnabled();
  });
});

describe("deleting a note", () => {
  it("sends the id with DELETE and refreshes on success", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    render(
      <NotesPanel notes={[note({ id: "note-1" })]} maxLength={MAX_NOTE_LENGTH} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Delete note" }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("/api/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "note-1" }),
    });
  });

  it("shows a generic message and leaves the delete button enabled again when the request itself fails", async () => {
    fetchMock.mockRejectedValue(new Error(""));
    render(
      <NotesPanel notes={[note({ id: "note-1" })]} maxLength={MAX_NOTE_LENGTH} />
    );

    const deleteButton = screen.getByRole("button", { name: "Delete note" });
    await userEvent.click(deleteButton);

    await waitFor(() =>
      expect(notification.addErrorNotification).toHaveBeenCalledWith(
        "An error occurred while deleting the note."
      )
    );
    expect(router.refresh).not.toHaveBeenCalled();
    // Same rule as the submit button above: `pendingId` is cleared in a
    // `finally`, so a failed delete leaves the row's button usable again.
    expect(deleteButton).toBeEnabled();
  });
});
