import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SESSION_COOKIE_NAME,
  SESSION_EXPIRES_IN,
  isRecent,
} from "@/lib/firebase/session";

const NOW = new Date("2026-01-01T00:00:00Z");
const nowSeconds = NOW.getTime() / 1000;

describe("session constants", () => {
  it("names the session cookie", () => {
    expect(SESSION_COOKIE_NAME).toBe("firebase-session");
  });

  it("expires sessions after two weeks, in milliseconds", () => {
    expect(SESSION_EXPIRES_IN).toBe(14 * 24 * 60 * 60 * 1000);
  });
});

describe("isRecent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a timestamp from this instant", () => {
    expect(isRecent(nowSeconds)).toBe(true);
  });

  it("accepts a timestamp just inside the five minute window", () => {
    expect(isRecent(nowSeconds - 299)).toBe(true);
  });

  it("accepts a timestamp exactly five minutes old", () => {
    expect(isRecent(nowSeconds - 300)).toBe(true);
  });

  it("rejects a timestamp just outside the window", () => {
    expect(isRecent(nowSeconds - 301)).toBe(false);
  });

  it("rejects a clearly stale timestamp", () => {
    expect(isRecent(nowSeconds - 60 * 60)).toBe(false);
  });

  it("accepts a timestamp in the future", () => {
    // Clock skew between Firebase and this server must not lock a user out.
    expect(isRecent(nowSeconds + 60)).toBe(true);
  });
});
