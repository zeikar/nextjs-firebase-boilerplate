import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/session";
import { cookieJar } from "../helpers/cookie-jar";

const adminAuth = vi.hoisted(() => ({
  verifySessionCookie: vi.fn(),
  verifyIdToken: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock("@/lib/firebase/admin", () => ({ adminAuth }));
vi.mock("next/headers", async () => {
  const { cookieJar } = await import("../helpers/cookie-jar");
  return { cookies: async () => cookieJar.store };
});

const { GET, DELETE } = await import("@/app/api/auth/user/route");

const NOW = new Date("2026-01-01T00:00:00Z");
const nowSeconds = NOW.getTime() / 1000;

const REAUTH_REQUIRED = "Re-authentication is required.";

const DEFAULT_HEADERS = {
  host: "example.com",
  origin: "https://example.com",
  "content-type": "application/json",
};

function deleteRequest(
  body: unknown = { idToken: "id-token" },
  headers: Record<string, string> = DEFAULT_HEADERS
) {
  return new NextRequest("https://example.com/api/auth/user", {
    method: "DELETE",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function givenSessionCookie() {
  cookieJar.store.set({ name: SESSION_COOKIE_NAME, value: "session-cookie" });
}

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.reset();
  vi.setSystemTime(NOW);
  vi.spyOn(console, "error").mockImplementation(() => {});
  adminAuth.deleteUser.mockResolvedValue(undefined);
});

describe("GET /api/auth/user", () => {
  it("returns the user behind a valid session", async () => {
    givenSessionCookie();
    adminAuth.verifySessionCookie.mockResolvedValue({
      uid: "user-1",
      email: "user@example.com",
      name: "Example User",
      picture: "https://example.com/avatar.png",
      firebase: { sign_in_provider: "google.com" },
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      user: {
        uid: "user-1",
        email: "user@example.com",
        displayName: "Example User",
        photoURL: "https://example.com/avatar.png",
        isAnonymous: false,
      },
    });
  });

  it("reports an anonymous user as anonymous, with null profile fields", async () => {
    givenSessionCookie();
    adminAuth.verifySessionCookie.mockResolvedValue({
      uid: "anon-1",
      firebase: { sign_in_provider: "anonymous" },
    });

    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      success: true,
      user: {
        uid: "anon-1",
        email: null,
        displayName: null,
        photoURL: null,
        isAnonymous: true,
      },
    });
  });

  it("answers 401 when there is no session cookie", async () => {
    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      user: null,
    });
  });

  it("clears a cookie Firebase rejects", async () => {
    givenSessionCookie();
    adminAuth.verifySessionCookie.mockRejectedValue({
      code: "auth/session-cookie-revoked",
    });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(cookieJar.records.has(SESSION_COOKIE_NAME)).toBe(false);
  });

  it("answers 503 and keeps the cookie when Firebase cannot answer", async () => {
    // "Not signed in" would be a lie, and the session may well still be good.
    givenSessionCookie();
    adminAuth.verifySessionCookie.mockRejectedValue({
      code: "auth/internal-error",
    });

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      success: false,
      user: null,
      error: "Authentication is unavailable.",
    });
    expect(cookieJar.records.has(SESSION_COOKIE_NAME)).toBe(true);
  });
});

describe("DELETE /api/auth/user", () => {
  function givenFreshReauth(overrides: Record<string, unknown> = {}) {
    givenSessionCookie();
    adminAuth.verifySessionCookie.mockResolvedValue({ uid: "user-1" });
    adminAuth.verifyIdToken.mockResolvedValue({
      uid: "user-1",
      auth_time: nowSeconds,
      iat: nowSeconds,
      firebase: { sign_in_provider: "google.com" },
      ...overrides,
    });
  }

  it("rejects a cross-site request", async () => {
    givenFreshReauth();

    const response = await DELETE(
      deleteRequest(undefined, { ...DEFAULT_HEADERS, origin: "https://attacker.example" })
    );

    expect(response.status).toBe(403);
    expect(adminAuth.deleteUser).not.toHaveBeenCalled();
  });

  it("rejects a body that is not declared as JSON", async () => {
    givenFreshReauth();

    const response = await DELETE(
      deleteRequest(undefined, { ...DEFAULT_HEADERS, "content-type": "text/plain" })
    );

    expect(response.status).toBe(415);
    expect(adminAuth.deleteUser).not.toHaveBeenCalled();
  });

  it("requires a session cookie", async () => {
    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "No authenticated user found.",
    });
  });

  it("requires a re-authentication token", async () => {
    givenSessionCookie();

    const response = await DELETE(deleteRequest({}));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: REAUTH_REQUIRED,
    });
    expect(adminAuth.deleteUser).not.toHaveBeenCalled();
  });

  it("treats an unparseable body as no token", async () => {
    givenSessionCookie();

    const response = await DELETE(deleteRequest("not json"));

    expect(response.status).toBe(401);
    expect(adminAuth.deleteUser).not.toHaveBeenCalled();
  });

  it("deletes the account and clears the session", async () => {
    givenFreshReauth();

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(adminAuth.deleteUser).toHaveBeenCalledWith("user-1");
    expect(cookieJar.records.has(SESSION_COOKIE_NAME)).toBe(false);
  });

  it("checks both credentials for revocation", async () => {
    givenFreshReauth();

    await DELETE(deleteRequest());

    expect(adminAuth.verifySessionCookie).toHaveBeenCalledWith("session-cookie", true);
    expect(adminAuth.verifyIdToken).toHaveBeenCalledWith("id-token", true);
  });

  it("refuses a token that belongs to a different user", async () => {
    givenFreshReauth({ uid: "someone-else" });

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: REAUTH_REQUIRED,
    });
    expect(adminAuth.deleteUser).not.toHaveBeenCalled();
  });

  it("refuses a stale sign-in", async () => {
    givenFreshReauth({ auth_time: nowSeconds - 3600 });

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(401);
    expect(adminAuth.deleteUser).not.toHaveBeenCalled();
  });

  it("accepts a just-issued token from an anonymous user", async () => {
    // Anonymous users have no credential to re-authenticate with, so a fresh
    // `iat` stands in for a fresh sign-in.
    givenFreshReauth({
      auth_time: nowSeconds - 3600,
      iat: nowSeconds,
      firebase: { sign_in_provider: "anonymous" },
    });

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(200);
    expect(adminAuth.deleteUser).toHaveBeenCalledWith("user-1");
  });

  it("refuses a copied anonymous token that was issued too long ago", async () => {
    givenFreshReauth({
      auth_time: nowSeconds,
      iat: nowSeconds - 3600,
      firebase: { sign_in_provider: "anonymous" },
    });

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(401);
    expect(adminAuth.deleteUser).not.toHaveBeenCalled();
  });

  it("clears the session when the credential was rejected", async () => {
    givenSessionCookie();
    adminAuth.verifySessionCookie.mockRejectedValue({
      code: "auth/session-cookie-expired",
    });

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: REAUTH_REQUIRED,
    });
    expect(cookieJar.records.has(SESSION_COOKIE_NAME)).toBe(false);
  });

  it("keeps the session when the failure is the backend's", async () => {
    givenSessionCookie();
    adminAuth.verifySessionCookie.mockRejectedValue({
      code: "auth/internal-error",
    });

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Failed to delete account.",
    });
    expect(cookieJar.records.has(SESSION_COOKIE_NAME)).toBe(true);
  });

  it("keeps the session when the account could not be deleted", async () => {
    givenFreshReauth();
    adminAuth.deleteUser.mockRejectedValue(new Error("backend down"));

    const response = await DELETE(deleteRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Failed to delete account.",
    });
    expect(cookieJar.records.has(SESSION_COOKIE_NAME)).toBe(true);
  });
});
