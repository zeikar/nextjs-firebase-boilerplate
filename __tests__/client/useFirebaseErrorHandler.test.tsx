/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NotificationProvider,
  useNotification,
} from "@/contexts/notification-context";
import { useFirebaseErrorHandler } from "@/lib/utils/useFirebaseErrorHandler";
import "./setup";

// The handler only reports through the notification context, so both are read
// from one render to assert what a call actually produced.
function useProbe() {
  return {
    handler: useFirebaseErrorHandler(),
    notifications: useNotification().notifications,
  };
}

let probe: { current: ReturnType<typeof useProbe> };

function readState(): [string, string][] {
  return probe.current.notifications.map((n) => [n.type, n.message]);
}

beforeEach(() => {
  vi.useFakeTimers();
  probe = renderHook(useProbe, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <NotificationProvider>{children}</NotificationProvider>
    ),
  }).result;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("showFirebaseError", () => {
  it("translates a known Firebase code and raises it as an error notification", () => {
    let returned: string | undefined;
    act(() => {
      returned = probe.current.handler.showFirebaseError({
        code: "auth/popup-blocked",
      }) as string;
    });

    expect(returned).toBe(
      "Sign-in popup was blocked. Please allow popups for this site."
    );
    expect(readState()).toEqual([
      ["error", "Sign-in popup was blocked. Please allow popups for this site."],
    ]);
  });

  it("uses the raw message when the code is unknown", () => {
    act(() => {
      probe.current.handler.showFirebaseError({
        code: "auth/nope",
        message: "Odd failure",
      });
    });

    expect(readState()).toEqual([["error", "Odd failure"]]);
  });

  it("falls back to a generic message when nothing is usable", () => {
    act(() => {
      probe.current.handler.showFirebaseError(null);
    });

    expect(readState()).toEqual([["error", "An unknown error occurred."]]);
  });

  it("ignores the caller's fallback when a message was resolved", () => {
    // getFirebaseErrorMessage always returns something, so the fallback only
    // exists for the empty-string case.
    act(() => {
      probe.current.handler.showFirebaseError(
        { code: "auth/user-not-found" },
        "unused"
      );
    });

    expect(readState()).toEqual([["error", "User not found."]]);
  });
});

describe("the typed passthroughs", () => {
  it.each([
    ["showErrorMessage", "error"],
    ["showSuccessMessage", "success"],
    ["showInfoMessage", "info"],
    ["showWarningMessage", "warning"],
  ] as const)("%s raises a %s notification", (method, type) => {
    act(() => {
      probe.current.handler[method]("hello");
    });

    expect(readState()).toEqual([[type, "hello"]]);
  });
});
