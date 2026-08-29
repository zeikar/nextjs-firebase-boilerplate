/**
 * @vitest-environment jsdom
 */
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NotificationItem from "@/components/notifications/notification-item";
import type { Notification } from "@/contexts/notification-context";
import "./setup";

const DURATION = 5000;
const EXIT_ANIMATION = 300;

function notification(overrides: Partial<Notification> = {}): Notification {
  return { id: 1, type: "info", message: "something happened", ...overrides };
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("rendering", () => {
  it("shows the message", () => {
    render(<NotificationItem notification={notification({ message: "saved" })} />);

    expect(screen.getByText("saved")).toBeInTheDocument();
  });

  it.each([
    ["error", "Error"],
    ["success", "Success"],
    ["warning", "Warning"],
    ["info", "Info"],
  ] as const)("titles a %s notification %s", (type, title) => {
    render(<NotificationItem notification={notification({ type })} />);

    expect(screen.getByText(title)).toBeInTheDocument();
  });
});

describe("auto dismissal", () => {
  it("removes itself after the duration plus the exit animation", () => {
    const onRemove = vi.fn();
    render(
      <NotificationItem
        notification={notification()}
        onRemove={onRemove}
        duration={DURATION}
      />
    );

    advance(DURATION);
    // The exit animation still has to play out first.
    expect(onRemove).not.toHaveBeenCalled();

    advance(EXIT_ANIMATION);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("stays put before its time is up", () => {
    const onRemove = vi.fn();
    render(
      <NotificationItem
        notification={notification()}
        onRemove={onRemove}
        duration={DURATION}
      />
    );

    advance(DURATION - 1 + EXIT_ANIMATION);

    expect(onRemove).not.toHaveBeenCalled();
  });

  it("honours a custom duration", () => {
    const onRemove = vi.fn();
    render(
      <NotificationItem
        notification={notification()}
        onRemove={onRemove}
        duration={1000}
      />
    );

    advance(1000 + EXIT_ANIMATION);

    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

describe("close button", () => {
  it("dismisses through the same animated path", () => {
    const onRemove = vi.fn();
    render(<NotificationItem notification={notification()} onRemove={onRemove} />);

    act(() => {
      screen.getByRole("button").click();
    });
    expect(onRemove).not.toHaveBeenCalled();

    advance(EXIT_ANIMATION);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("removes exactly once when the timer also fires", () => {
    // Both paths share one dismissal, so a close click just before the
    // auto-dismiss must not remove the notification twice.
    const onRemove = vi.fn();
    render(
      <NotificationItem
        notification={notification()}
        onRemove={onRemove}
        duration={DURATION}
      />
    );

    advance(DURATION - 100);
    act(() => {
      screen.getByRole("button").click();
    });
    advance(DURATION + EXIT_ANIMATION);

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("ignores repeated clicks", () => {
    const onRemove = vi.fn();
    render(<NotificationItem notification={notification()} onRemove={onRemove} />);

    const close = screen.getByRole("button");
    act(() => {
      close.click();
      close.click();
      close.click();
    });
    advance(EXIT_ANIMATION);

    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

describe("when the parent re-renders", () => {
  it("does not restart its timer, and calls the latest callback", () => {
    // The container passes a new inline arrow on every render, so one
    // notification appearing must not extend another's lifetime.
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(
      <NotificationItem
        notification={notification()}
        onRemove={first}
        duration={DURATION}
      />
    );

    advance(DURATION - 500);

    rerender(
      <NotificationItem
        notification={notification()}
        onRemove={second}
        duration={DURATION}
      />
    );

    // Had the re-render restarted the timer, nothing would fire here.
    advance(500 + EXIT_ANIMATION);

    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });
});

describe("on unmount", () => {
  it("does not remove afterwards", () => {
    const onRemove = vi.fn();
    const { unmount } = render(
      <NotificationItem
        notification={notification()}
        onRemove={onRemove}
        duration={DURATION}
      />
    );

    unmount();
    advance(DURATION + EXIT_ANIMATION);

    expect(onRemove).not.toHaveBeenCalled();
  });

  it("does not remove when unmounted mid-animation", () => {
    const onRemove = vi.fn();
    const { unmount } = render(
      <NotificationItem notification={notification()} onRemove={onRemove} />
    );

    act(() => {
      screen.getByRole("button").click();
    });
    unmount();
    advance(EXIT_ANIMATION);

    expect(onRemove).not.toHaveBeenCalled();
  });
});
