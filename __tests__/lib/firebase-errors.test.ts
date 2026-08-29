import { describe, expect, it } from "vitest";
import {
  getErrorMessage,
  getFirebaseErrorMessage,
  isRejectedCredentialError,
} from "@/lib/utils/firebaseErrors";

describe("getErrorMessage", () => {
  it("reads the message off an Error", () => {
    expect(getErrorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("reads the message off a plain object", () => {
    expect(getErrorMessage({ message: "boom" }, "fallback")).toBe("boom");
  });

  it("falls back when there is no message", () => {
    expect(getErrorMessage({}, "fallback")).toBe("fallback");
  });

  it("falls back on an empty message", () => {
    expect(getErrorMessage({ message: "" }, "fallback")).toBe("fallback");
  });

  it("falls back on a non-string message", () => {
    expect(getErrorMessage({ message: 500 }, "fallback")).toBe("fallback");
  });

  it("falls back on null and undefined", () => {
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback");
  });
});

describe("isRejectedCredentialError", () => {
  it.each([
    "auth/id-token-expired",
    "auth/id-token-revoked",
    "auth/invalid-id-token",
    "auth/session-cookie-expired",
    "auth/session-cookie-revoked",
    "auth/user-disabled",
    "auth/user-not-found",
  ])("treats %s as a rejected credential", (code) => {
    expect(isRejectedCredentialError({ code })).toBe(true);
  });

  it.each([
    // Same namespace, but the request never reached a verdict - treating
    // these as a rejection would clear a session that may still be good.
    "auth/internal-error",
    "auth/invalid-credential",
    "auth/quota-exceeded",
    // Deliberately absent: the Admin SDK also raises it when it cannot fetch
    // Google's public keys, which is a server failure, not a bad token.
    "auth/argument-error",
  ])("does not treat %s as a rejected credential", (code) => {
    expect(isRejectedCredentialError({ code })).toBe(false);
  });

  it("reads a code out of a parenthesised message", () => {
    const error = new Error("Decoding failed (auth/id-token-expired).");

    expect(isRejectedCredentialError(error)).toBe(true);
  });

  it("prefers an explicit code over one in the message", () => {
    const error = { code: "auth/internal-error", message: "(auth/user-not-found)" };

    expect(isRejectedCredentialError(error)).toBe(false);
  });

  it("is false for values that carry no code", () => {
    expect(isRejectedCredentialError(null)).toBe(false);
    expect(isRejectedCredentialError(undefined)).toBe(false);
    expect(isRejectedCredentialError("auth/user-not-found")).toBe(false);
    expect(isRejectedCredentialError({})).toBe(false);
    expect(isRejectedCredentialError(new Error("no code here"))).toBe(false);
  });
});

describe("getFirebaseErrorMessage", () => {
  it("translates a known code", () => {
    expect(getFirebaseErrorMessage({ code: "auth/wrong-password" })).toBe(
      "Incorrect password."
    );
  });

  it("translates a code found in the message", () => {
    const error = new Error("Firebase: Error (auth/popup-blocked).");

    expect(getFirebaseErrorMessage(error)).toBe(
      "Sign-in popup was blocked. Please allow popups for this site."
    );
  });

  it("falls back to the raw message for an unknown code", () => {
    const error = { code: "auth/some-new-code", message: "Something specific" };

    expect(getFirebaseErrorMessage(error)).toBe("Something specific");
  });

  it("falls back to a generic message when nothing is usable", () => {
    expect(getFirebaseErrorMessage(null)).toBe("An unknown error occurred.");
    expect(getFirebaseErrorMessage({})).toBe("An unknown error occurred.");
  });
});
