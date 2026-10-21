import { renderHook } from "@testing-library/react";
import { captureError } from "@/lib/errorTracking";
import { useReportError } from "@/app/components/ErrorFallback/hooks";

jest.mock("@/lib/errorTracking", () => ({ captureError: jest.fn() }));

describe("useReportError", () => {
  afterEach(() => jest.clearAllMocks());

  it("reports the error once, even across re-renders", () => {
    const error = new Error("boom");
    const { rerender } = renderHook(({ err }) => useReportError(err), {
      initialProps: { err: error },
    });
    rerender({ err: error });
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError).toHaveBeenCalledWith(error);
  });

  it("reports again when a new error arrives", () => {
    const { rerender } = renderHook(({ err }) => useReportError(err), {
      initialProps: { err: new Error("first") },
    });
    rerender({ err: new Error("second") });
    expect(captureError).toHaveBeenCalledTimes(2);
  });
});
