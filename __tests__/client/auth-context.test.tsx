/**
 * @vitest-environment jsdom
 */
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import "./setup";

const firebaseAuth = vi.hoisted(() => ({
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  signInAnonymously: vi.fn(),
  linkWithPopup: vi.fn(),
  reauthenticateWithPopup: vi.fn(),
}));

vi.mock("firebase/auth", () => firebaseAuth);
vi.mock("@/lib/firebase/client", () => ({
  auth: { currentUser: null },
  googleProvider: { id: "google" },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/firebase/authService", () => ({
  sendTokenToServer: vi.fn().mockResolvedValue({ success: true }),
  deleteSession: vi.fn().mockResolvedValue({ success: true }),
  deleteUserAccount: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock("@/lib/utils/useFirebaseErrorHandler", () => ({
  useFirebaseErrorHandler: () => ({
    showFirebaseError: vi.fn(),
    showErrorMessage: vi.fn(),
    showSuccessMessage: vi.fn(),
    showInfoMessage: vi.fn(),
    showWarningMessage: vi.fn(),
  }),
}));

// Two independent consumers, to prove they read one shared state rather than
// each holding their own copy of the hook.
function Consumer({ label }: { label: string }) {
  const { loadingProvider, isAuthLoading, signInWithGoogle } = useAuth();

  return (
    <div>
      <span data-testid={`${label}-provider`}>{loadingProvider ?? "idle"}</span>
      <span data-testid={`${label}-busy`}>{String(isAuthLoading)}</span>
      <button onClick={() => void signInWithGoogle()}>{label} sign in</button>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("AuthProvider", () => {
  it("gives every consumer the same auth state", async () => {
    let release!: (value: unknown) => void;
    firebaseAuth.signInWithPopup.mockReturnValue(
      new Promise((r) => (release = r))
    );

    render(
      <AuthProvider>
        <Consumer label="first" />
        <Consumer label="second" />
      </AuthProvider>
    );

    expect(screen.getByTestId("first-provider")).toHaveTextContent("idle");
    expect(screen.getByTestId("second-provider")).toHaveTextContent("idle");

    act(() => {
      screen.getByRole("button", { name: "first sign in" }).click();
    });

    // The operation started in the first consumer must disable the second one
    // too, or the two could race over the same user and session cookie.
    await waitFor(() =>
      expect(screen.getByTestId("second-provider")).toHaveTextContent("google")
    );
    expect(screen.getByTestId("second-busy")).toHaveTextContent("true");

    await act(async () => {
      release({
        user: { uid: "u", getIdToken: vi.fn().mockResolvedValue("t") },
      });
    });

    expect(screen.getByTestId("first-provider")).toHaveTextContent("idle");
    expect(screen.getByTestId("second-provider")).toHaveTextContent("idle");
  });

  it("exposes the whole auth surface", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      ),
    });

    expect(Object.keys(result.current).sort()).toEqual([
      "deleteAccount",
      "isAuthLoading",
      "linkWithGoogle",
      "loadingProvider",
      "signInAnonymously",
      "signInWithGoogle",
      "signOut",
    ]);
  });
});

describe("useAuth", () => {
  it("refuses to run outside a provider", () => {
    function Orphan() {
      useAuth();
      return null;
    }

    expect(() => render(<Orphan />)).toThrow(
      "useAuth must be used within an AuthProvider"
    );
  });
});
