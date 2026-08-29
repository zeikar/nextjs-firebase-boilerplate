import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FieldValue } from "firebase-admin/firestore";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/session";
import { MAX_NOTE_LENGTH } from "@/lib/firebase/notes";
import { cookieJar } from "../helpers/cookie-jar";
import { firestoreDouble } from "../helpers/firestore-double";

const adminAuth = vi.hoisted(() => ({
  verifySessionCookie: vi.fn(),
}));

vi.mock("@/lib/firebase/admin", async () => {
  const { firestoreDouble } = await import("../helpers/firestore-double");
  return { adminAuth, adminDb: firestoreDouble.adminDb };
});
vi.mock("next/headers", async () => {
  const { cookieJar } = await import("../helpers/cookie-jar");
  return { cookies: async () => cookieJar.store };
});

const { POST, DELETE } = await import("@/app/api/notes/route");

const DEFAULT_HEADERS = {
  host: "example.com",
  origin: "https://example.com",
  "content-type": "application/json",
};

function notesRequest(
  method: "POST" | "DELETE",
  body: unknown,
  headers: Record<string, string> = DEFAULT_HEADERS
) {
  return new NextRequest("https://example.com/api/notes", {
    method,
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function setSessionCookie() {
  cookieJar.store.set({ name: SESSION_COOKIE_NAME, value: "session-cookie" });
}

function givenSession(uid: string) {
  setSessionCookie();
  // `getServerSession` reads `claims.firebase.sign_in_provider`, so it has
  // to be present or the claim lookup throws before the uid is ever used.
  adminAuth.verifySessionCookie.mockResolvedValue({
    uid,
    firebase: { sign_in_provider: "password" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.reset();
  firestoreDouble.reset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/notes", () => {
  it("rejects a cross-site request", async () => {
    givenSession("user-1");

    const response = await POST(
      notesRequest("POST", { text: "hello" }, { ...DEFAULT_HEADERS, origin: "https://attacker.example" })
    );

    expect(response.status).toBe(403);
    expect(firestoreDouble.add).not.toHaveBeenCalled();
  });

  it("rejects a body that is not declared as JSON", async () => {
    givenSession("user-1");

    const response = await POST(
      notesRequest("POST", { text: "hello" }, { ...DEFAULT_HEADERS, "content-type": "text/plain" })
    );

    expect(response.status).toBe(415);
    expect(firestoreDouble.add).not.toHaveBeenCalled();
  });

  it("requires a session cookie", async () => {
    const response = await POST(notesRequest("POST", { text: "hello" }));

    expect(response.status).toBe(401);
    expect(firestoreDouble.add).not.toHaveBeenCalled();
  });

  it("answers 401 when the session cookie is rejected", async () => {
    setSessionCookie();
    adminAuth.verifySessionCookie.mockRejectedValue({ code: "auth/session-cookie-expired" });

    const response = await POST(notesRequest("POST", { text: "hello" }));

    expect(response.status).toBe(401);
    expect(firestoreDouble.add).not.toHaveBeenCalled();
  });

  it("answers 503 when Firebase cannot verify the session", async () => {
    // "Not signed in" would be a lie, so an outage must not read as a 401.
    setSessionCookie();
    adminAuth.verifySessionCookie.mockRejectedValue({ code: "auth/internal-error" });

    const response = await POST(notesRequest("POST", { text: "hello" }));

    expect(response.status).toBe(503);
    expect(firestoreDouble.add).not.toHaveBeenCalled();
  });

  describe("validation", () => {
    beforeEach(() => {
      givenSession("user-1");
    });

    it("rejects a missing text field", async () => {
      const response = await POST(notesRequest("POST", {}));

      expect(response.status).toBe(400);
      expect(firestoreDouble.add).not.toHaveBeenCalled();
    });

    it("rejects blank text", async () => {
      const response = await POST(notesRequest("POST", { text: "" }));

      expect(response.status).toBe(400);
      expect(firestoreDouble.add).not.toHaveBeenCalled();
    });

    it("rejects whitespace-only text", async () => {
      const response = await POST(notesRequest("POST", { text: "   " }));

      expect(response.status).toBe(400);
      expect(firestoreDouble.add).not.toHaveBeenCalled();
    });

    it("rejects a non-string text field", async () => {
      const response = await POST(notesRequest("POST", { text: 42 }));

      expect(response.status).toBe(400);
      expect(firestoreDouble.add).not.toHaveBeenCalled();
    });

    it("rejects text over the maximum length", async () => {
      const response = await POST(
        notesRequest("POST", { text: "a".repeat(MAX_NOTE_LENGTH + 1) })
      );

      expect(response.status).toBe(400);
      expect(firestoreDouble.add).not.toHaveBeenCalled();
    });

    it("rejects an unparseable body", async () => {
      const response = await POST(notesRequest("POST", "not json"));

      expect(response.status).toBe(400);
      expect(firestoreDouble.add).not.toHaveBeenCalled();
    });
  });

  it("adds the trimmed note under the session uid's path", async () => {
    givenSession("user-1");

    const response = await POST(notesRequest("POST", { text: "  hello  " }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(firestoreDouble.add).toHaveBeenCalledWith("users/user-1/notes", {
      text: "hello",
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  it("ignores a uid in the body and writes only under the session uid", async () => {
    // The authorization control this route rests on: a body-supplied uid
    // must have zero influence on the Firestore path, or one user could
    // write into another user's notes. Pin the exact path so a regression
    // here cannot slip through unnoticed.
    givenSession("user-1");

    await POST(notesRequest("POST", { text: "hello", uid: "someone-else" }));

    expect(firestoreDouble.add).toHaveBeenCalledWith(
      "users/user-1/notes",
      expect.objectContaining({ text: "hello" })
    );
    expect(firestoreDouble.add).not.toHaveBeenCalledWith(
      expect.stringContaining("someone-else"),
      expect.anything()
    );
  });

  it("answers 500 when the write fails", async () => {
    givenSession("user-1");
    firestoreDouble.add.mockRejectedValue(new Error("backend down"));

    const response = await POST(notesRequest("POST", { text: "hello" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Failed to save the note.",
    });
  });
});

describe("DELETE /api/notes", () => {
  it("rejects a cross-site request", async () => {
    givenSession("user-1");

    const response = await DELETE(
      notesRequest("DELETE", { id: "note-1" }, { ...DEFAULT_HEADERS, origin: "https://attacker.example" })
    );

    expect(response.status).toBe(403);
    expect(firestoreDouble.delete).not.toHaveBeenCalled();
  });

  it("rejects a body that is not declared as JSON", async () => {
    givenSession("user-1");

    const response = await DELETE(
      notesRequest("DELETE", { id: "note-1" }, { ...DEFAULT_HEADERS, "content-type": "text/plain" })
    );

    expect(response.status).toBe(415);
    expect(firestoreDouble.delete).not.toHaveBeenCalled();
  });

  it("requires a session cookie", async () => {
    const response = await DELETE(notesRequest("DELETE", { id: "note-1" }));

    expect(response.status).toBe(401);
    expect(firestoreDouble.delete).not.toHaveBeenCalled();
  });

  it("answers 401 when the session cookie is rejected", async () => {
    setSessionCookie();
    adminAuth.verifySessionCookie.mockRejectedValue({ code: "auth/session-cookie-expired" });

    const response = await DELETE(notesRequest("DELETE", { id: "note-1" }));

    expect(response.status).toBe(401);
    expect(firestoreDouble.delete).not.toHaveBeenCalled();
  });

  it("answers 503 when Firebase cannot verify the session", async () => {
    setSessionCookie();
    adminAuth.verifySessionCookie.mockRejectedValue({ code: "auth/internal-error" });

    const response = await DELETE(notesRequest("DELETE", { id: "note-1" }));

    expect(response.status).toBe(503);
    expect(firestoreDouble.delete).not.toHaveBeenCalled();
  });

  describe("validation", () => {
    beforeEach(() => {
      givenSession("user-1");
    });

    it("rejects a missing id", async () => {
      const response = await DELETE(notesRequest("DELETE", {}));

      expect(response.status).toBe(400);
      expect(firestoreDouble.delete).not.toHaveBeenCalled();
    });

    it("rejects a non-string id", async () => {
      const response = await DELETE(notesRequest("DELETE", { id: 42 }));

      expect(response.status).toBe(400);
      expect(firestoreDouble.delete).not.toHaveBeenCalled();
    });

    it("rejects an id containing a slash", async () => {
      // A `/` would let the id address a document path outside the
      // caller's own notes subcollection.
      const response = await DELETE(
        notesRequest("DELETE", { id: "../someone-else/notes/x" })
      );

      expect(response.status).toBe(400);
      expect(firestoreDouble.delete).not.toHaveBeenCalled();
    });
  });

  it("deletes the note at the session uid's path", async () => {
    givenSession("user-1");

    const response = await DELETE(notesRequest("DELETE", { id: "note-1" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(firestoreDouble.delete).toHaveBeenCalledWith("users/user-1/notes/note-1");
  });

  it("ignores a uid in the body and deletes only under the session uid", async () => {
    // Same authorization control as the POST scoping test: a body-supplied
    // uid must not redirect the delete to another user's notes.
    givenSession("user-1");

    await DELETE(notesRequest("DELETE", { id: "note-1", uid: "someone-else" }));

    expect(firestoreDouble.delete).toHaveBeenCalledWith("users/user-1/notes/note-1");
    expect(firestoreDouble.delete).not.toHaveBeenCalledWith(
      expect.stringContaining("someone-else")
    );
  });

  it("answers 500 when the delete fails", async () => {
    givenSession("user-1");
    firestoreDouble.delete.mockRejectedValue(new Error("backend down"));

    const response = await DELETE(notesRequest("DELETE", { id: "note-1" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Failed to delete the note.",
    });
  });
});
