/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccountDeleteButton from "@/components/auth/AccountDeleteButton";
import AccountUpgradeButton from "@/components/auth/AccountUpgradeButton";
import AuthButtons from "@/components/auth/AuthButtons";
import AuthModal from "@/components/modals/AuthModal";
import type { AuthOperation } from "@/lib/firebase/useFirebaseAuth";
import "./setup";

const auth = vi.hoisted(() => ({
  loadingProvider: null as AuthOperation,
  isAuthLoading: false,
  signInWithGoogle: vi.fn(),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
  linkWithGoogle: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock("@/contexts/auth-context", () => ({ useAuth: () => auth }));

function busyWith(provider: AuthOperation) {
  auth.loadingProvider = provider;
  auth.isAuthLoading = provider !== null;
}

const signedInUser = {
  uid: "user-1",
  email: "user@example.com",
  displayName: "Example User",
  photoURL: null,
  isAnonymous: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  busyWith(null);
  auth.signInWithGoogle.mockResolvedValue({ success: true });
  auth.signInAnonymously.mockResolvedValue({ success: true });
  auth.signOut.mockResolvedValue({ success: true });
  auth.linkWithGoogle.mockResolvedValue({ success: true });
  auth.deleteAccount.mockResolvedValue({ success: true });
});

describe("AuthButtons", () => {
  it("offers sign-out to a signed-in user", async () => {
    render(<AuthButtons user={signedInUser} />);

    await userEvent.click(screen.getByRole("button", { name: /sign out/i }));

    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("opens the sign-in modal for a signed-out visitor", async () => {
    render(<AuthButtons user={null} />);

    expect(screen.queryByText("Sign In Options")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Sign In Options")).toBeInTheDocument();
  });

  it("disables sign-out while any operation is running", () => {
    busyWith("google");
    render(<AuthButtons user={signedInUser} />);

    expect(screen.getByRole("button", { name: /sign out/i })).toBeDisabled();
  });

  it("disables sign-in while any operation is running", () => {
    busyWith("anonymous");
    render(<AuthButtons user={null} />);

    expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
  });
});

describe("AccountDeleteButton", () => {
  it("does nothing when the confirmation is declined", async () => {
    // Deletion is irreversible, so the guard is the whole point of this button.
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<AccountDeleteButton />);

    await userEvent.click(screen.getByRole("button"));

    expect(confirm).toHaveBeenCalled();
    expect(auth.deleteAccount).not.toHaveBeenCalled();
  });

  it("deletes once the confirmation is accepted", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AccountDeleteButton />);

    await userEvent.click(screen.getByRole("button"));

    expect(auth.deleteAccount).toHaveBeenCalledTimes(1);
  });

  it("warns that the action cannot be undone", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<AccountDeleteButton />);

    await userEvent.click(screen.getByRole("button"));

    expect(confirm.mock.calls[0][0]).toMatch(/cannot be undone/i);
  });

  it("is disabled while another operation is running", () => {
    busyWith("link");
    render(<AccountDeleteButton />);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("AccountUpgradeButton", () => {
  it("links the anonymous account with Google", async () => {
    render(<AccountUpgradeButton />);

    await userEvent.click(screen.getByRole("button"));

    expect(auth.linkWithGoogle).toHaveBeenCalledTimes(1);
  });

  it("is disabled while another operation is running", () => {
    busyWith("delete");
    render(<AccountUpgradeButton />);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("AuthModal", () => {
  it("renders nothing while closed", () => {
    render(<AuthModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByText("Sign In Options")).not.toBeInTheDocument();
  });

  it("offers both ways in", () => {
    render(<AuthModal isOpen onClose={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /sign in with google/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue as guest/i })
    ).toBeInTheDocument();
  });

  it.each([
    [/sign in with google/i, "signInWithGoogle"],
    [/continue as guest/i, "signInAnonymously"],
  ] as const)("closes after %s succeeds", async (name, method) => {
    const onClose = vi.fn();
    render(<AuthModal isOpen onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name }));

    expect(auth[method]).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it.each([
    [/sign in with google/i, "signInWithGoogle"],
    [/continue as guest/i, "signInAnonymously"],
  ] as const)("stays open when %s fails, so the user can retry", async (name, method) => {
    auth[method].mockResolvedValue({ success: false, error: "nope" });
    const onClose = vi.fn();
    render(<AuthModal isOpen onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name }));

    await waitFor(() => expect(auth[method]).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Sign In Options")).toBeInTheDocument();
  });

  it("disables both options while one is running", () => {
    busyWith("google");
    render(<AuthModal isOpen onClose={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /sign in with google/i })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /continue as guest/i })
    ).toBeDisabled();
  });

  it("closes on the dismiss button", async () => {
    const onClose = vi.fn();
    render(<AuthModal isOpen onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalled();
  });
});

describe("loading indicators", () => {
  it("AuthButtons spins only while signing out", () => {
    busyWith("signout");
    const { unmount } = render(<AuthButtons user={signedInUser} />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    unmount();

    busyWith("google");
    render(<AuthButtons user={signedInUser} />);
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });

  it("AccountDeleteButton spins only while deleting", () => {
    busyWith("delete");
    const { unmount } = render(<AccountDeleteButton />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    unmount();

    busyWith("link");
    render(<AccountDeleteButton />);
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });

  it("AccountUpgradeButton spins only while linking", () => {
    busyWith("link");
    const { unmount } = render(<AccountUpgradeButton />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    unmount();

    busyWith("delete");
    render(<AccountUpgradeButton />);
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });

  it("AuthModal spins on the running option only", () => {
    busyWith("google");
    render(<AuthModal isOpen onClose={vi.fn()} />);

    // One spinner, and it belongs to the Google button.
    expect(screen.getAllByTestId("loading-spinner")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: /sign in with google/i })
    ).toContainElement(screen.getByTestId("loading-spinner"));
  });
});

describe("when an auth action rejects", () => {
  it("AccountDeleteButton reports it instead of crashing", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "confirm").mockReturnValue(true);
    auth.deleteAccount.mockRejectedValue(new Error("boom"));
    render(<AccountDeleteButton />);

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(logged).toHaveBeenCalled());
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("AccountUpgradeButton reports it instead of crashing", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    auth.linkWithGoogle.mockRejectedValue(new Error("boom"));
    render(<AccountUpgradeButton />);

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(logged).toHaveBeenCalled());
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});

describe("the sign-in modal's lifecycle", () => {
  it("closes again from inside the modal", async () => {
    render(<AuthButtons user={null} />);

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText("Sign In Options")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() =>
      expect(screen.queryByText("Sign In Options")).not.toBeInTheDocument()
    );
  });
})
