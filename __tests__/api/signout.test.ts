import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/session";
import { cookieJar } from "../helpers/cookie-jar";

const adminAuth = vi.hoisted(() => ({
  verifySessionCookie: vi.fn(),
  revokeRefreshTokens: vi.fn(),
}));

vi.mock("@/lib/firebase/admin", () => ({ adminAuth }));
vi.mock("next/headers", async () => {
  const { cookieJar } = await import("../helpers/cookie-jar");
  return { cookies: async () => cookieJar.store };
});

const { POST } = await import("@/app/api/auth/signout/route");

const NOW = new Date("2026-01-01T00:00:00Z");
const nowSeconds = NOW.getTime() / 1000;

const REVOCATION_FAILED =
  "Signed out on this device, but the server session could not be revoked.";

function signoutRequest(headers: Record<string, string> = {}) {
  return new NextRequest("https://example.com/api/auth/signout", {
    method: "POST",
    headers: { host: "example.com", origin: "https://example.com", ...headers },
  });
}

function givenSession(authTime = nowSeconds - 60) {
  cookieJar.store.set({ name: SESSION_COOKIE_NAME, value: "session-cookie" });
  adminAuth.verifySessionCookie.mockResolvedValue({
    uid: "user-1",
    auth_time: authTime,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.reset();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.spyOn(console, "error").mockImplementation(() => {});
  adminAuth.revokeRefreshTokens.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("POST /api/auth/signout", () => {
  it("rejects a cross-site request and keeps the session", async () => {
    givenSession();

    const response = await POST(signoutRequest({ origin: "https://attacker.example" }));

    expect(response.status).toBe(403);
    expect(cookieJar.records.has(SESSION_COOKIE_NAME)).toBe(true);
    expect(adminAuth.revokeRefreshTokens).not.toHaveBeenCalled();
  });

  it("succeeds when there is no session to end", async () => {
    const response = await POST(signoutRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(adminAuth.verifySessionCookie).not.toHaveBeenCalled();
    expect(adminAuth.revokeRefreshTokens).not.toHaveBeenCalled();
  });

  it("revokes every session of the user and clears the cookie", async () => {
    givenSession();

    const response = await POST(signoutRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(adminAuth.revokeRefreshTokens).toHaveBeenCalledWith("user-1");
    expect(cookieJar.records.has(SESSION_COOKIE_NAME)).toBe(false);
  });

  it("treats a cookie Firebase rejects as already signed out", async () => {
    cookieJar.store.set({ name: SESSION_COOKIE_NAME, value: "expired" });
    adminAuth.verifySessionCookie.mockRejectedValue({
      code: "auth/session-cookie-expired",
    });

    const response = await POST(signoutRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(adminAuth.revokeRefreshTokens).not.toHaveBeenCalled();
    expect(cookieJar.records.has(SESSION_COOKIE_NAME)).toBe(false);
  });

  it("reports a backend failure instead of claiming a completed sign-out", async () => {
    cookieJar.store.set({ name: SESSION_COOKIE_NAME, value: "session-cookie" });
    adminAuth.verifySessionCookie.mockRejectedValue({
      code: "auth/internal-error",
    });

    const response = await POST(signoutRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: REVOCATION_FAILED,
    });
    // The cookie is gone from this browser either way.
    expect(cookieJar.records.has(SESSION_COOKIE_NAME)).toBe(false);
  });

  it("reports a failure when revocation itself fails", async () => {
    givenSession();
    adminAuth.revokeRefreshTokens.mockRejectedValue(new Error("network down"));

    const response = await POST(signoutRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: REVOCATION_FAILED,
    });
  });

  it("waits out the same-second race before revoking", async () => {
    // Revocation only rejects tokens whose auth_time is strictly before the
    // second it happened, so signing out in the same second as signing in
    // would otherwise leave the cookie working.
    givenSession(nowSeconds);

    const pending = POST(signoutRequest());

    await vi.advanceTimersByTimeAsync(500);
    expect(adminAuth.revokeRefreshTokens).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(500);
    const response = await pending;

    expect(adminAuth.revokeRefreshTokens).toHaveBeenCalledWith("user-1");
    expect(response.status).toBe(200);
  });

  it("does not wait when the sign-in is already revokable", async () => {
    givenSession(nowSeconds - 60);

    const response = await POST(signoutRequest());

    expect(response.status).toBe(200);
    expect(adminAuth.revokeRefreshTokens).toHaveBeenCalledWith("user-1");
  });
});
