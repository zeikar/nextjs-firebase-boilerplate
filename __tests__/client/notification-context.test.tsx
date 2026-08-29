/**
 * @vitest-environment jsdom
 */
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NotificationProvider,
  useNotification,
} from "@/contexts/notification-context";
import "./setup";

// Renders the raw context state so the tests can assert on ids and types
// rather than on the notification chrome, which has its own test file.
function Probe() {
  const {
    notifications,
    addErrorNotification,
    addInfoNotification,
    addSuccessNotification,
    addWarningNotification,
    removeNotification,
  } = useNotification();

  return (
    <div>
      <button onClick={() => addErrorNotification("boom")}>add error</button>
      <button onClick={() => addInfoNotification("fyi")}>add info</button>
      <button onClick={() => addSuccessNotification("done")}>add success</button>
      <button onClick={() => addWarningNotification("careful")}>add warning</button>
      <button onClick={() => removeNotification(notifications[0]?.id)}>
        remove first
      </button>
      <output data-testid="state">
        {JSON.stringify(notifications.map((n) => [n.id, n.type, n.message]))}
      </output>
    </div>
  );
}

function readState(): [number, string, string][] {
  return JSON.parse(screen.getByTestId("state").textContent ?? "[]");
}

function click(name: string) {
  act(() => {
    screen.getByRole("button", { name }).click();
  });
}

beforeEach(() => {
  // The notification chrome starts timers on mount; freezing them keeps this
  // file's assertions about context state free of unrelated re-renders.
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function renderProbe() {
  return render(
    <NotificationProvider>
      <Probe />
    </NotificationProvider>
  );
}

describe("NotificationProvider", () => {
  it("starts with nothing to show", () => {
    renderProbe();

    expect(readState()).toEqual([]);
  });

  it.each([
    ["add error", "error", "boom"],
    ["add info", "info", "fyi"],
    ["add success", "success", "done"],
    ["add warning", "warning", "careful"],
  ])("%s adds a %s notification", (button, type, message) => {
    renderProbe();

    click(button);

    const state = readState();
    expect(state).toHaveLength(1);
    expect(state[0][1]).toBe(type);
    expect(state[0][2]).toBe(message);
  });

  it("keeps ids unique when several arrive in the same millisecond", () => {
    // The id is a timestamp plus a counter precisely so a burst cannot collide
    // and give two notifications the same React key.
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    renderProbe();

    click("add error");
    click("add info");
    click("add success");

    const ids = readState().map(([id]) => id);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
  });

  it("appends in arrival order", () => {
    renderProbe();

    click("add error");
    click("add info");

    expect(readState().map(([, , message]) => message)).toEqual(["boom", "fyi"]);
  });

  it("removes only the notification asked for", () => {
    renderProbe();

    click("add error");
    click("add info");
    click("remove first");

    expect(readState().map(([, , message]) => message)).toEqual(["fyi"]);
  });
});

describe("useNotification", () => {
  it("refuses to run outside a provider", () => {
    // React logs the thrown error through its own handler too.
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(
      "useNotification must be used within a NotificationProvider"
    );
  });
});

describe("addNotification", () => {
  it("accepts a type and message directly", () => {
    // The typed helpers are sugar over this; it is public API in its own right.
    function RawProbe() {
      const { notifications, addNotification } = useNotification();
      return (
        <div>
          <button
            onClick={() => addNotification({ type: "warning", message: "raw" })}
          >
            add raw
          </button>
          <output data-testid="state">
            {JSON.stringify(notifications.map((n) => [n.id, n.type, n.message]))}
          </output>
        </div>
      );
    }

    render(
      <NotificationProvider>
        <RawProbe />
      </NotificationProvider>
    );

    click("add raw");

    const state = readState();
    expect(state).toHaveLength(1);
    expect(state[0][1]).toBe("warning");
    expect(state[0][2]).toBe("raw");
  });
});
