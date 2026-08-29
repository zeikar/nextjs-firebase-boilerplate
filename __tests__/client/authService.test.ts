import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteSession,
  deleteUserAccount,
  sendTokenToServer,
} from "@/lib/firebase/authService";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body };
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sendTokenToServer", () => {
  it("posts the ID token as JSON to the sign-in route", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, uid: "user-1" }));

    await expect(sendTokenToServer("id-token")).resolves.toEqual({
      success: true,
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: "id-token" }),
    });
  });

  it("surfaces the server's error message on a rejected response", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false, error: "Recent sign-in required." }, false)
    );

    await expect(sendTokenToServer("stale")).resolves.toEqual({
      success: false,
      error: "Recent sign-in required.",
    });
  });

  it("fails when the body says so even on a 200", async () => {
    // `success: false` is authoritative regardless of the status code.
    fetchMock.mockResolvedValue(jsonResponse({ success: false }));

    const result = await sendTokenToServer("token");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Server authentication failed.");
  });

  it("falls back to a generic message when the request itself throws", async () => {
    fetchMock.mockRejectedValue(new Error(""));

    await expect(sendTokenToServer("token")).resolves.toEqual({
      success: false,
      error: "An error occurred during server authentication.",
    });
  });

  it("keeps a thrown error's own message when it has one", async () => {
    fetchMock.mockRejectedValue(new Error("Failed to fetch"));

    await expect(sendTokenToServer("token")).resolves.toEqual({
      success: false,
      error: "Failed to fetch",
    });
  });
});

describe("deleteSession", () => {
  it("posts to the sign-out route with no body", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));

    await expect(deleteSession()).resolves.toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/signout", {
      method: "POST",
    });
  });

  it("reports a revocation failure back to the caller", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          success: false,
          error:
            "Signed out on this device, but the server session could not be revoked.",
        },
        false
      )
    );

    await expect(deleteSession()).resolves.toEqual({
      success: false,
      error:
        "Signed out on this device, but the server session could not be revoked.",
    });
  });

  it("falls back to a generic message when the request throws", async () => {
    fetchMock.mockRejectedValue(new Error(""));

    await expect(deleteSession()).resolves.toEqual({
      success: false,
      error: "An error occurred while signing out.",
    });
  });
});

describe("deleteUserAccount", () => {
  it("sends DELETE with the re-authentication token", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));

    await expect(deleteUserAccount("fresh-token")).resolves.toEqual({
      success: true,
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/user", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: "fresh-token" }),
    });
  });

  it("surfaces a re-authentication demand", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false, error: "Re-authentication is required." }, false)
    );

    await expect(deleteUserAccount("stale")).resolves.toEqual({
      success: false,
      error: "Re-authentication is required.",
    });
  });

  it("falls back to a generic message when the request throws", async () => {
    fetchMock.mockRejectedValue(new Error(""));

    await expect(deleteUserAccount("token")).resolves.toEqual({
      success: false,
      error: "An error occurred while deleting account.",
    });
  });
});
