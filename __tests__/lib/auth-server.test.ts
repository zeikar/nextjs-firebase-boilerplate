import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/session";
import { cookieJar } from "../helpers/cookie-jar";

const adminAuth = vi.hoisted(() => ({
  verifySessionCookie: vi.fn(),
}));

vi.mock("@/lib/firebase/admin", () => ({ adminAuth }));
vi.mock("next/headers", async () => {
  const { cookieJar } = await import("../helpers/cookie-jar");
  return { cookies: async () => cookieJar.store };
});

const { getServerUser } = await import("@/lib/firebase/auth-server");

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.reset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// The session states themselves are covered through the auth routes; what is
// left is the page-facing helper, which flattens all of them to "user or
// nobody to render".
describe("getServerUser", () => {
  it("returns the user behind a valid session", async () => {
    cookieJar.store.set({ name: SESSION_COOKIE_NAME, value: "session-cookie" });
    adminAuth.verifySessionCookie.mockResolvedValue({
      uid: "user-1",
      email: "user@example.com",
      name: "Example User",
      picture: "https://example.com/avatar.png",
      firebase: { sign_in_provider: "google.com" },
    });

    await expect(getServerUser()).resolves.toEqual({
      uid: "user-1",
      email: "user@example.com",
      displayName: "Example User",
      photoURL: "https://example.com/avatar.png",
      isAnonymous: false,
    });
  });

  it("returns null when there is no session cookie", async () => {
    await expect(getServerUser()).resolves.toBeNull();
  });

  it("returns null when Firebase cannot answer", async () => {
    cookieJar.store.set({ name: SESSION_COOKIE_NAME, value: "session-cookie" });
    adminAuth.verifySessionCookie.mockRejectedValue({
      code: "auth/internal-error",
    });

    await expect(getServerUser()).resolves.toBeNull();
  });
});
