import { vi } from "vitest";

/**
 * A stand-in for `adminDb`, covering only what the notes routes touch:
 * `collection().doc().collection()` to reach a user's notes subcollection,
 * `add`/`delete` to write and remove one, and `recursiveDelete` for the
 * account-deletion sweep. Every ref built by the chain carries its joined
 * path, and the write spies are called with that path, so tests can assert
 * exactly which document was touched instead of trusting the chain was
 * built correctly.
 */
export type FirestoreRef = {
  path: string;
  collection(name: string): FirestoreRef;
  doc(id: string): FirestoreRef;
  add(data: unknown): Promise<unknown>;
  delete(): Promise<unknown>;
};

function createFirestoreDouble() {
  const add = vi.fn();
  const del = vi.fn();
  const recursiveDelete = vi.fn();

  function makeRef(path: string): FirestoreRef {
    return {
      path,
      collection: (name: string) => makeRef(`${path}/${name}`),
      doc: (id: string) => makeRef(`${path}/${id}`),
      add: (data: unknown) => add(path, data),
      delete: () => del(path),
    };
  }

  return {
    adminDb: {
      collection: (name: string) => makeRef(name),
      recursiveDelete: (ref: FirestoreRef) => recursiveDelete(ref.path),
    },
    add,
    delete: del,
    recursiveDelete,
    reset() {
      add.mockReset().mockResolvedValue(undefined);
      del.mockReset().mockResolvedValue(undefined);
      recursiveDelete.mockReset().mockResolvedValue(undefined);
    },
  };
}

// One instance per test file - Vitest gives each file its own module registry,
// so the mock factory and the test body see the same double without leaking
// between files.
export const firestoreDouble = createFirestoreDouble();
