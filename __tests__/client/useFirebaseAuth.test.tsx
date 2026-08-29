/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFirebaseAuth } from "@/lib/firebase/useFirebaseAuth";
import "./setup";

const firebaseAuth = vi.hoisted(() => ({
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  signInAnonymously: vi.fn(),
  linkWithPopup: vi.fn(),
  reauthenticateWithPopup: vi.fn(),
}));
const client = vi.hoisted(() => ({
  auth: { currentUser: null as unknown },
  googleProvider: { id: "google" },
}));
const router = vi.hoisted(() => ({ refresh: vi.fn() }));
const authService = vi.hoisted(() => ({
  sendTokenToServer: vi.fn(),
  deleteSession: vi.fn(),
  deleteUserAccount: vi.fn(),
}));
const notify = vi.hoisted(() => ({
  showFirebaseError: vi.fn(),
  showErrorMessage: vi.fn(),
  showSuccessMessage: vi.fn(),
  showInfoMessage: vi.fn(),
  showWarningMessage: vi.fn(),
}));

vi.mock("firebase/auth", () => firebaseAuth);
vi.mock("@/lib/firebase/client", () => client);
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/firebase/authService", () => authService);
vi.mock("@/lib/utils/useFirebaseErrorHandler", () => ({
  useFirebaseErrorHandler: () => notify,
}));

function userWith(overrides: Record<string, unknown> = {}) {
  return {
    uid: "user-1",
    isAnonymous: false,
    getIdToken: vi.fn().mockResolvedValue("id-token"),
    ...overrides,
  };
}

function credentialFor(user = userWith()) {
  return { user };
}

beforeEach(() => {
  vi.clearAllMocks();
  client.auth.currentUser = null;
  vi.spyOn(console, "error").mockImplementation(() => {});
  authService.sendTokenToServer.mockResolvedValue({ success: true });
  authService.deleteSession.mockResolvedValue({ success: true });
  authService.deleteUserAccount.mockResolvedValue({ success: true });
  firebaseAuth.signOut.mockResolvedValue(undefined);
});

describe.each([
  ["signInWithGoogle", "google", () => firebaseAuth.signInWithPopup],
  ["signInAnonymously", "anonymous", () => firebaseAuth.signInAnonymously],
] as const)("%s", (method, providerKey, entryPoint) => {
  it("exchanges the ID token for a session and refreshes the page", async () => {
    entryPoint().mockResolvedValue(credentialFor());
    const { result } = renderHook(() => useFirebaseAuth());

    await act(async () => {
      await expect(result.current[method]()).resolves.toEqual({ success: true });
    });

    expect(authService.sendTokenToServer).toHaveBeenCalledWith("id-token");
    expect(router.refresh).toHaveBeenCalled();
    expect(notify.showSuccessMessage).toHaveBeenCalledWith(
      "Successfully signed in."
    );
    expect(firebaseAuth.signOut).not.toHaveBeenCalled();
  });

  it("signs the client back out when the server refuses the token", async () => {
    // Otherwise the client thinks it is signed in while the server holds no
    // session, and the two disagree about who the user is.
    entryPoint().mockResolvedValue(credentialFor());
    authService.sendTokenToServer.mockResolvedValue({
      success: false,
      error: "Recent sign-in required.",
    });
    const { result } = renderHook(() => useFirebaseAuth());

    await act(async () => {
      await expect(result.current[method]()).resolves.toEqual({
        success: false,
        error: "Recent sign-in required.",
      });
    });

    expect(firebaseAuth.signOut).toHaveBeenCalledWith(client.auth);
    expect(notify.showErrorMessage).toHaveBeenCalledWith(
      "Recent sign-in required."
    );
    expect(notify.showSuccessMessage).not.toHaveBeenCalled();
  });

  it("reports a failure from the popup itself", async () => {
    entryPoint().mockRejectedValue({ code: "auth/popup-closed-by-user" });
    const { result } = renderHook(() => useFirebaseAuth());

    let outcome: { success: boolean } | undefined;
    await act(async () => {
      outcome = await result.current[method]();
    });

    expect(outcome?.success).toBe(false);
    expect(notify.showFirebaseError).toHaveBeenCalled();
    expect(authService.sendTokenToServer).not.toHaveBeenCalled();
  });

  it(`reports "${providerKey}" as the operation in flight, then clears it`, async () => {
    let release!: (value: unknown) => void;
    entryPoint().mockReturnValue(new Promise((r) => (release = r)));
    const { result } = renderHook(() => useFirebaseAuth());

    act(() => {
      void result.current[method]();
    });
    await waitFor(() => expect(result.current.loadingProvider).toBe(providerKey));
    expect(result.current.isAuthLoading).toBe(true);

    await act(async () => {
      release(credentialFor());
    });

    expect(result.current.loadingProvider).toBeNull();
    expect(result.current.isAuthLoading).toBe(false);
  });
});

describe("signOut", () => {
  it("clears both sides and refreshes", async () => {
    const { result } = renderHook(() => useFirebaseAuth());

    await act(async () => {
      await expect(result.current.signOut()).resolves.toEqual({ success: true });
    });

    expect(firebaseAuth.signOut).toHaveBeenCalledWith(client.auth);
    expect(authService.deleteSession).toHaveBeenCalled();
    expect(router.refresh).toHaveBeenCalled();
    expect(notify.showSuccessMessage).toHaveBeenCalledWith(
      "Successfully signed out."
    );
  });

  it("still deletes the server session when the client sign-out fails", async () => {
    // The two are cleared independently on purpose - one failing must not
    // leave the other in place.
    firebaseAuth.signOut.mockRejectedValue({ code: "auth/network-request-failed" });
    const { result } = renderHook(() => useFirebaseAuth());

    let outcome: { success: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.signOut();
    });

    expect(authService.deleteSession).toHaveBeenCalled();
    expect(router.refresh).toHaveBeenCalled();
    expect(outcome?.success).toBe(false);
    expect(notify.showFirebaseError).toHaveBeenCalled();
  });

  it("warns rather than claims success when the session was not revoked", async () => {
    authService.deleteSession.mockResolvedValue({
      success: false,
      error: "The server session could not be revoked.",
    });
    const { result } = renderHook(() => useFirebaseAuth());

    await act(async () => {
      await expect(result.current.signOut()).resolves.toEqual({
        success: false,
        error: "The server session could not be revoked.",
      });
    });

    expect(notify.showWarningMessage).toHaveBeenCalledWith(
      "The server session could not be revoked."
    );
    expect(notify.showSuccessMessage).not.toHaveBeenCalled();
  });

  it("warns when the session request rejects outright", async () => {
    authService.deleteSession.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useFirebaseAuth());

    let outcome: { success: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.signOut();
    });

    expect(outcome?.success).toBe(false);
    expect(notify.showWarningMessage).toHaveBeenCalled();
  });

  it("clears the in-flight operation afterwards", async () => {
    const { result } = renderHook(() => useFirebaseAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.loadingProvider).toBeNull();
  });
});

describe("linkWithGoogle", () => {
  it("refuses when nobody is signed in", async () => {
    const { result } = renderHook(() => useFirebaseAuth());

    let outcome: { success: boolean; error?: string } | undefined;
    await act(async () => {
      outcome = await result.current.linkWithGoogle();
    });

    expect(outcome).toEqual({
      success: false,
      error: "No authenticated user found",
    });
    expect(firebaseAuth.linkWithPopup).not.toHaveBeenCalled();
  });

  it("links, forces a fresh token, and updates the session", async () => {
    const user = userWith();
    client.auth.currentUser = user;
    firebaseAuth.linkWithPopup.mockResolvedValue(credentialFor(user));
    const { result } = renderHook(() => useFirebaseAuth());

    await act(async () => {
      await expect(result.current.linkWithGoogle()).resolves.toEqual({
        success: true,
      });
    });

    expect(firebaseAuth.linkWithPopup).toHaveBeenCalledWith(
      user,
      client.googleProvider
    );
    // `true` forces a refresh so the token carries the new provider.
    expect(user.getIdToken).toHaveBeenCalledWith(true);
    expect(router.refresh).toHaveBeenCalled();
    expect(notify.showSuccessMessage).toHaveBeenCalledWith(
      "Account successfully linked."
    );
  });

  it("warns but keeps the link when the server does not update the session", async () => {
    // The account is linked whatever the server answers, and the existing
    // cookie still covers the same uid - so this is a warning, not an error.
    const user = userWith();
    client.auth.currentUser = user;
    firebaseAuth.linkWithPopup.mockResolvedValue(credentialFor(user));
    authService.sendTokenToServer.mockResolvedValue({
      success: false,
      error: "Account linked, but the session was not updated.",
    });
    const { result } = renderHook(() => useFirebaseAuth());

    await act(async () => {
      await result.current.linkWithGoogle();
    });

    expect(router.refresh).toHaveBeenCalled();
    expect(notify.showWarningMessage).toHaveBeenCalledWith(
      "Account linked, but the session was not updated."
    );
    expect(notify.showFirebaseError).not.toHaveBeenCalled();
  });

  it("reports a failure from the link popup", async () => {
    client.auth.currentUser = userWith();
    firebaseAuth.linkWithPopup.mockRejectedValue({
      code: "auth/credential-already-in-use",
    });
    const { result } = renderHook(() => useFirebaseAuth());

    let outcome: { success: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.linkWithGoogle();
    });

    expect(outcome?.success).toBe(false);
    expect(notify.showFirebaseError).toHaveBeenCalled();
    expect(authService.sendTokenToServer).not.toHaveBeenCalled();
  });
});

describe("deleteAccount", () => {
  it("refuses when nobody is signed in", async () => {
    const { result } = renderHook(() => useFirebaseAuth());

    let outcome: { success: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.deleteAccount();
    });

    expect(outcome?.success).toBe(false);
    expect(authService.deleteUserAccount).not.toHaveBeenCalled();
  });

  it("re-authenticates a credentialed user before deleting", async () => {
    const user = userWith();
    client.auth.currentUser = user;
    firebaseAuth.reauthenticateWithPopup.mockResolvedValue(credentialFor(user));
    const { result } = renderHook(() => useFirebaseAuth());

    await act(async () => {
      await expect(result.current.deleteAccount()).resolves.toEqual({
        success: true,
      });
    });

    expect(firebaseAuth.reauthenticateWithPopup).toHaveBeenCalledWith(
      user,
      client.googleProvider
    );
    expect(user.getIdToken).toHaveBeenCalledWith(true);
    expect(authService.deleteUserAccount).toHaveBeenCalledWith("id-token");
    expect(firebaseAuth.signOut).toHaveBeenCalledWith(client.auth);
    expect(notify.showSuccessMessage).toHaveBeenCalledWith(
      "Account successfully deleted."
    );
  });

  it("skips re-authentication for an anonymous user", async () => {
    // They have no credential to re-authenticate with; a freshly minted token
    // is the strongest proof available.
    const user = userWith({ isAnonymous: true });
    client.auth.currentUser = user;
    const { result } = renderHook(() => useFirebaseAuth());

    await act(async () => {
      await expect(result.current.deleteAccount()).resolves.toEqual({
        success: true,
      });
    });

    expect(firebaseAuth.reauthenticateWithPopup).not.toHaveBeenCalled();
    expect(user.getIdToken).toHaveBeenCalledWith(true);
    expect(authService.deleteUserAccount).toHaveBeenCalledWith("id-token");
  });

  it("keeps the client session when the server refuses to delete", async () => {
    const user = userWith({ isAnonymous: true });
    client.auth.currentUser = user;
    authService.deleteUserAccount.mockResolvedValue({
      success: false,
      error: "Re-authentication is required.",
    });
    const { result } = renderHook(() => useFirebaseAuth());

    let outcome: { success: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.deleteAccount();
    });

    expect(outcome?.success).toBe(false);
    expect(firebaseAuth.signOut).not.toHaveBeenCalled();
    expect(notify.showFirebaseError).toHaveBeenCalled();
  });

  it("stops when re-authentication fails", async () => {
    client.auth.currentUser = userWith();
    firebaseAuth.reauthenticateWithPopup.mockRejectedValue({
      code: "auth/popup-closed-by-user",
    });
    const { result } = renderHook(() => useFirebaseAuth());

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(authService.deleteUserAccount).not.toHaveBeenCalled();
    expect(firebaseAuth.signOut).not.toHaveBeenCalled();
  });

  it("clears the in-flight operation afterwards", async () => {
    client.auth.currentUser = userWith({ isAnonymous: true });
    const { result } = renderHook(() => useFirebaseAuth());

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(result.current.loadingProvider).toBeNull();
  });
});
