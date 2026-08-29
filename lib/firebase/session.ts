// Firebase session cookie name
export const SESSION_COOKIE_NAME = "firebase-session";

// Session expiration time (2 weeks)
export const SESSION_EXPIRES_IN = 60 * 60 * 24 * 14 * 1000;

// How long a token counts as fresh proof of identity. Firebase recommends 5
// minutes for the sign-in that mints a session cookie.
const MAX_TOKEN_AGE_SECONDS = 5 * 60;

/**
 * True when a token timestamp is recent enough to act as proof: `auth_time`
 * for "the user just signed in", `iat` for "this token was just issued".
 * Both claims are in seconds since the epoch.
 */
export function isRecent(timestampSeconds: number): boolean {
  return Date.now() / 1000 - timestampSeconds <= MAX_TOKEN_AGE_SECONDS;
}
