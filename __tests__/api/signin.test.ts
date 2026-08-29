import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME, SESSION_EXPIRES_IN } from "@/lib/firebase/session";
import { cookieJar } from "../helpers/cookie-jar";

const adminAuth = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  createSessionCookie: vi.fn(),
  verifySessionCookie: vi.fn(),
}));

vi.mock("@/lib/firebase/admin", () => ({ adminAuth }));
vi.mock("next/headers", async () => {
  const { cookieJar } = await import("../helpers/cookie-jar");
  return { cookies: async () => cookieJar.store };
});

const { POST } = await import("@/app/api/auth/signin/route");

const NOW = new Date("2026-01-01T00:00:00Z");
const nowSeconds = NOW.getTime() / 1000;

const DEFAULT_HEADERS = {
  host: "example.com",
  origin: "https://example.com",
  "content-type": "application/json",
};

function signinRequest(
  body: unknown,
  headers: Record<string, string> = DEFAULT_HEADERS
) {
  return new NextRequest("https://example.com/api/auth/signin", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function decodedToken(overrides: Record<string, unknown> = {}) {
  return { uid: "user-1", auth_time: nowSeconds, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.reset();
  vi.setSystemTime(NOW);
  vi.spyOn(console, "error").mockImplementation(() => {});
  adminAuth.createSessionCookie.mockResolvedValue("minted-session-cookie");
});

describe("POST /api/auth/signin", () => {
  it("rejects a cross-site request before reading the body", async () => {
    const response = await POST(
      signinRequest({ idToken: "token" }, { host: "example.com" })
    );

    expect(response.status).toBe(403);
    expect(adminAuth.verifyIdToken).not.toHaveBeenCalled();
  });

  it("rejects a body that is not declared as JSON", async () => {
    const response = await POST(
      signinRequest(
        { idToken: "token" },
        { ...DEFAULT_HEADERS, "content-type": "text/plain" }
      )
    );

    expect(response.status).toBe(415);
    expect(adminAuth.verifyIdToken).not.toHaveBeenCalled();
  });

  it("requires an ID token", async () => {
    const response = await POST(signinRequest({}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "ID token is required.",
    });
  });

  it("rejects an ID token Firebase will not verify", async () => {
    adminAuth.verifyIdToken.mockRejectedValue({ code: "auth/id-token-expired" });

    const response = await POST(signinRequest({ idToken: "bad-token" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Authentication failed.",
    });
    expect(cookieJar.records.has(SESSION_COOKIE_NAME)).toBe(false);
  });

  it("asks Firebase to reject revoked tokens", async () => {
    adminAuth.verifyIdToken.mockResolvedValue(decodedToken());

    await POST(signinRequest({ idToken: "token" }));

    expect(adminAuth.verifyIdToken).toHaveBeenCalledWith("token", true);
  });

  it("mints a session cookie for a fresh sign-in", async () => {
    adminAuth.verifyIdToken.mockResolvedValue(decodedToken());

    const response = await POST(signinRequest({ idToken: "token" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      uid: "user-1",
    });
    expect(adminAuth.createSessionCookie).toHaveBeenCalledWith("token", {
      expiresIn: SESSION_EXPIRES_IN,
    });
    expect(cookieJar.records.get(SESSION_COOKIE_NAME)).toMatchObject({
      value: "minted-session-cookie",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_EXPIRES_IN / 1000,
    });
  });

  it("refuses to trade a stale ID token for a two week session", async () => {
    adminAuth.verifyIdToken.mockResolvedValue(
      decodedToken({ auth_time: nowSeconds - 3600 })
    );

    const response = await POST(signinRequest({ idToken: "stale-token" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Recent sign-in required.",
    });
    expect(adminAuth.createSessionCookie).not.toHaveBeenCalled();
  });

  it("re-mints for a stale token when this browser already holds that session", async () => {
    // The anonymous -> Google upgrade refreshes its cookie and grants no new
    // access, so it is exempt from the freshness rule.
    cookieJar.store.set({ name: SESSION_COOKIE_NAME, value: "existing" });
    adminAuth.verifySessionCookie.mockResolvedValue({
      uid: "user-1",
      firebase: { sign_in_provider: "anonymous" },
    });
    adminAuth.verifyIdToken.mockResolvedValue(
      decodedToken({ auth_time: nowSeconds - 3600 })
    );

    const response = await POST(signinRequest({ idToken: "stale-token" }));

    expect(response.status).toBe(200);
    expect(adminAuth.createSessionCookie).toHaveBeenCalled();
  });

  it("does not exempt a stale token when the session belongs to another user", async () => {
    cookieJar.store.set({ name: SESSION_COOKIE_NAME, value: "existing" });
    adminAuth.verifySessionCookie.mockResolvedValue({
      uid: "someone-else",
      firebase: { sign_in_provider: "google.com" },
    });
    adminAuth.verifyIdToken.mockResolvedValue(
      decodedToken({ auth_time: nowSeconds - 3600 })
    );

    const response = await POST(signinRequest({ idToken: "stale-token" }));

    expect(response.status).toBe(401);
    expect(adminAuth.createSessionCookie).not.toHaveBeenCalled();
  });
});
