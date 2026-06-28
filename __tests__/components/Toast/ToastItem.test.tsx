import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ToastItem from "@/app/components/Toast/ToastItem";
import type { Toast } from "@/app/components/Toast/types";

function makeToast(overrides: Partial<Toast> = {}): Toast {
  return {
    id: "t1",
    message: "Hello",
    variant: "info",
    durationMs: 5000,
    ...overrides,
  };
}

describe("ToastItem", () => {
  it("renders the message and a labelled dismiss button", () => {
    render(<ToastItem toast={makeToast()} onDismiss={() => {}} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Dismiss notification" })
    ).toBeInTheDocument();
  });

  it("uses role=alert for errors and role=status otherwise", () => {
    const { rerender } = render(
      <ToastItem toast={makeToast({ variant: "error" })} onDismiss={() => {}} />
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(
      <ToastItem
        toast={makeToast({ variant: "success" })}
        onDismiss={() => {}}
      />
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("dismisses with reason 'manual' when the close button is clicked", async () => {
    const onDismiss = jest.fn();
    const user = userEvent.setup();
    render(<ToastItem toast={makeToast()} onDismiss={onDismiss} />);

    await user.click(
      screen.getByRole("button", { name: "Dismiss notification" })
    );

    expect(onDismiss).toHaveBeenCalledWith("t1", "manual");
  });

  it("auto-dismisses with reason 'auto' after its duration", () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(<ToastItem toast={makeToast({ durationMs: 5000 })} onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(onDismiss).toHaveBeenCalledWith("t1", "auto");

    jest.useRealTimers();
  });

  it("stays sticky when durationMs <= 0", () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(<ToastItem toast={makeToast({ durationMs: 0 })} onDismiss={onDismiss} />);

    act(() => {
      jest.advanceTimersByTime(60000);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("pauses the countdown while hovered and resumes on leave", () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(<ToastItem toast={makeToast({ durationMs: 5000 })} onDismiss={onDismiss} />);
    const item = screen.getByRole("status");

    // Hover first so the paused state is applied and the timer is cleared,
    // then advance time well past the duration.
    act(() => {
      fireEvent.mouseEnter(item);
    });
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      fireEvent.mouseLeave(item);
    });
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(onDismiss).toHaveBeenCalledWith("t1", "auto");

    jest.useRealTimers();
  });
});
