import { act, renderHook } from "@testing-library/react";
import {
  DEFAULT_DURATION_MS,
  resolveDuration,
  resolveVariant,
  useToast,
  useToastProvider,
} from "@/app/components/Toast/hooks";
import type { ToastEvent } from "@/app/components/Toast/types";

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
}

describe("Toast pure helpers", () => {
  it("default to the info variant and 5000ms duration", () => {
    expect(resolveVariant()).toBe("info");
    expect(resolveDuration()).toBe(DEFAULT_DURATION_MS);
    expect(DEFAULT_DURATION_MS).toBe(5000);
  });

  it("honour explicit overrides", () => {
    expect(resolveVariant({ variant: "error" })).toBe("error");
    expect(resolveDuration({ durationMs: 100 })).toBe(100);
  });
});

describe("useToastProvider", () => {
  beforeEach(() => {
    setVisibility("visible");
  });

  it("adds toasts with the correct variant and message", () => {
    const { result } = renderHook(() => useToastProvider());

    act(() => {
      result.current.success("Saved");
    });
    act(() => {
      result.current.error("Nope");
    });

    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0]).toMatchObject({
      message: "Saved",
      variant: "success",
      durationMs: DEFAULT_DURATION_MS,
    });
    expect(result.current.toasts[1]).toMatchObject({
      message: "Nope",
      variant: "error",
    });
  });

  it("returns the generated id from showToast and dismisses by id", () => {
    const { result } = renderHook(() => useToastProvider());

    let id = "";
    act(() => {
      id = result.current.showToast("Hi");
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(id).toBe(result.current.toasts[0].id);

    act(() => {
      result.current.dismiss(id, "manual");
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it("keeps multiple toasts independent", () => {
    const { result } = renderHook(() => useToastProvider());

    let first = "";
    act(() => {
      first = result.current.showToast("one");
    });
    act(() => {
      result.current.showToast("two");
    });
    act(() => {
      result.current.dismiss(first, "manual");
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe("two");
  });

  it("emits shown and dismissed events to onEvent (decoupled analytics sink)", () => {
    const events: ToastEvent[] = [];
    const onEvent = jest.fn((event: ToastEvent) => events.push(event));
    const { result } = renderHook(() => useToastProvider(onEvent));

    let id = "";
    act(() => {
      id = result.current.showToast("Hi", { variant: "success" });
    });
    act(() => {
      result.current.dismiss(id, "manual");
    });

    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(events[0]).toMatchObject({ type: "shown" });
    expect(events[0].toast.message).toBe("Hi");
    expect(events[1]).toMatchObject({ type: "dismissed", reason: "manual" });
  });

  it("queues toasts while the tab is hidden and flushes on return", () => {
    const onEvent = jest.fn();
    setVisibility("hidden");
    const { result } = renderHook(() => useToastProvider(onEvent));

    act(() => {
      result.current.showToast("Background work done");
    });

    // Nothing visible and no "shown" event while hidden.
    expect(result.current.toasts).toHaveLength(0);
    expect(onEvent).not.toHaveBeenCalled();

    setVisibility("visible");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe("Background work done");
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "shown" })
    );
  });
});

describe("useToast", () => {
  it("throws when used outside a ToastProvider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useToast())).toThrow(
      "useToast must be used within a ToastProvider"
    );
    spy.mockRestore();
  });
});
