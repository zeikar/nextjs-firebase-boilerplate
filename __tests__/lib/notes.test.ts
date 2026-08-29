import { describe, expect, it, vi } from "vitest";

// `lib/firebase/notes` imports `adminDb` from `./admin`, which throws at
// import time without a service account - mocking it here only makes the
// import safe; `isTransientFirestoreError` never touches `adminDb`.
vi.mock("@/lib/firebase/admin", async () => {
  const { firestoreDouble } = await import("../helpers/firestore-double");
  return { adminDb: firestoreDouble.adminDb };
});

const { isTransientFirestoreError } = await import("@/lib/firebase/notes");

describe("isTransientFirestoreError", () => {
  it.each([
    [14, "UNAVAILABLE"],
    [4, "DEADLINE_EXCEEDED"],
    [8, "RESOURCE_EXHAUSTED"],
    [13, "INTERNAL"],
  ])("treats gRPC code %i (%s) as transient", (code) => {
    expect(isTransientFirestoreError({ code })).toBe(true);
  });

  it.each([
    // Deliberately not retried - each is a configuration or programming
    // fault, not a "try again later" condition, so it has to surface. This
    // is the same rethrow the home page depends on when it renders notes.
    [5, "NOT_FOUND - no database provisioned"],
    [7, "PERMISSION_DENIED"],
    [16, "UNAUTHENTICATED"],
    [9, "FAILED_PRECONDITION"],
  ])("does not treat gRPC code %i (%s) as transient", (code) => {
    expect(isTransientFirestoreError({ code })).toBe(false);
  });

  it("does not treat a plain Error as transient", () => {
    expect(isTransientFirestoreError(new Error("boom"))).toBe(false);
  });

  it("does not treat null as transient", () => {
    expect(isTransientFirestoreError(null)).toBe(false);
  });

  it("does not treat a string as transient", () => {
    expect(isTransientFirestoreError("UNAVAILABLE")).toBe(false);
  });
});
