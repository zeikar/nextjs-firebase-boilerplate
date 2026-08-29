// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import { GrpcStatus } from "firebase-admin/firestore";
import { adminDb } from "./admin";

export const MAX_NOTE_LENGTH = 200;

// `createdAt` is an ISO string, not a Firestore `Timestamp` - a `Timestamp`
// cannot cross the server/client component boundary.
export type Note = { id: string; text: string; createdAt: string };

/**
 * The per-user notes subcollection. This only builds a path for whatever uid
 * it is handed, so ownership rests entirely on every caller passing the uid
 * from the verified session cookie, never one taken from a request body or
 * path segment. Nesting notes under `users/{uid}` also keeps the
 * `createdAt` ordering query inside a single collection, which Firestore can
 * serve with its automatic single-field index instead of a composite one.
 */
export function userNotes(uid: string) {
  return adminDb.collection("users").doc(uid).collection("notes");
}

// An allow-list, not a deny-list: `NOT_FOUND` (no database provisioned),
// `PERMISSION_DENIED` / `UNAUTHENTICATED` (a broken service account) and
// anything unrecognised are configuration or programming faults that have to
// surface, not be retried or masked as "try again later".
const transientCodes: number[] = [
  GrpcStatus.UNAVAILABLE,
  GrpcStatus.DEADLINE_EXCEEDED,
  GrpcStatus.RESOURCE_EXHAUSTED,
  GrpcStatus.INTERNAL,
];

export function isTransientFirestoreError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;

  return typeof code === "number" && transientCodes.includes(code);
}
