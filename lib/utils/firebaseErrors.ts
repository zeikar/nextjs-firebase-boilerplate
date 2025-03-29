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
 * Extract Firebase error code from error object
 */
const getFirebaseErrorCode = (error: any): string | null => {
  if (!error) return null;
  
  // Direct Firebase error format (contains code property)
  if (error.code) return error.code;
  
  // Error message might contain the code
  if (error.message && typeof error.message === 'string') {
    const match = error.message.match(/\(([^)]+)\)/);
    if (match && match[1]) return match[1];
  }
  
  return null;
};

/**
 * Get user-friendly message from Firebase error
 */
export const getFirebaseErrorMessage = (error: any): string => {
  const code = getFirebaseErrorCode(error);
  
  if (code && authErrorMessages[code]) {
    return authErrorMessages[code];
  }
  
  // Generic error message as fallback
  return error?.message || 'An unknown error occurred.';
};

// Export error code map for any external usage
export const errorMessages = authErrorMessages;