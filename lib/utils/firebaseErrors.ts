/**
 * Firebase Error Handler
 * Translates Firebase error codes to user-friendly messages
 */

// Common Firebase error codes and their user-friendly messages
type FirebaseErrorCodeMap = {
  [key: string]: string;
};

const authErrorMessages: FirebaseErrorCodeMap = {
  // Authentication errors
  'auth/email-already-in-use': 'This email address is already in use.',
  'auth/invalid-email': 'Invalid email address format.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'User not found.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/too-many-requests': 'Too many requests. Please try again later.',
  'auth/operation-not-allowed': 'This operation is not allowed.',
  'auth/weak-password': 'Password is too weak. Please use a stronger password.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed before completing authentication.',
  'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups for this site.',
  'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.',
  'auth/network-request-failed': 'A network error has occurred.',
  'auth/timeout': 'The operation has timed out.',
  'auth/credential-already-in-use': 'This credential is already associated with a different user account.',
  'auth/requires-recent-login': 'This operation requires recent authentication. Please sign in again.',

  // Firestore errors
  'firestore/permission-denied': 'Permission denied.',
  'firestore/unavailable': 'The service is unavailable.',
  
  // Storage errors
  'storage/unauthorized': 'User does not have permission to access the requested file.',
  'storage/canceled': 'File upload was canceled.',
  'storage/quota-exceeded': 'Storage quota has been exceeded.',
};

/**
 * Read the `message` of anything that was thrown, if it has one
 */
export const getErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  const message = (error as { message?: unknown } | null)?.message;

  return typeof message === 'string' && message ? message : fallback;
};

/**
 * Extract Firebase error code from error object
 */
const getFirebaseErrorCode = (error: unknown): string | null => {
  if (!error || typeof error !== 'object') return null;

  const { code, message } = error as { code?: unknown; message?: unknown };

  // Direct Firebase error format (contains code property)
  if (typeof code === 'string') return code;

  // Error message might contain the code
  if (typeof message === 'string') {
    const match = message.match(/\(([^)]+)\)/);
    if (match && match[1]) return match[1];
  }

  return null;
};

/**
 * Firebase Admin error codes meaning the credential the caller presented was
 * rejected. Codes like `auth/internal-error`, `auth/invalid-credential` or
 * `auth/quota-exceeded` share the namespace but say the request never reached
 * a verdict, so the namespace alone cannot be the test: only a real rejection
 * may clear a session or count as "already signed out".
 *
 * `auth/argument-error` is deliberately absent. The Admin SDK also raises it
 * when it cannot fetch Google's public keys, and telling that apart from a
 * malformed token would mean matching on SDK message strings. An unverifiable
 * token is therefore treated as a server failure - the safe direction, since
 * the alternative is claiming a session was revoked when it was not.
 */
const rejectedCredentialCodes = new Set([
  'auth/id-token-expired',
  'auth/id-token-revoked',
  'auth/invalid-id-token',
  'auth/session-cookie-expired',
  'auth/session-cookie-revoked',
  'auth/user-disabled',
  'auth/user-not-found',
]);

export const isRejectedCredentialError = (error: unknown): boolean => {
  const code = getFirebaseErrorCode(error);
  return code !== null && rejectedCredentialCodes.has(code);
};

/**
 * Get user-friendly message from Firebase error
 */
export const getFirebaseErrorMessage = (error: unknown): string => {
  const code = getFirebaseErrorCode(error);

  if (code && authErrorMessages[code]) {
    return authErrorMessages[code];
  }

  // Generic error message as fallback
  return getErrorMessage(error, 'An unknown error occurred.');
};