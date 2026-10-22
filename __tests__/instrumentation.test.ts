import { captureRequestError } from "@/lib/errorTracking";
import { logRequestError } from "@/lib/logger/requestLog";
import { onRequestError } from "@/instrumentation";

jest.mock("@/lib/errorTracking", () => ({
  captureRequestError: jest.fn(),
  initServerErrorTracking: jest.fn(),
}));
jest.mock("@/lib/logger/requestLog", () => ({ logRequestError: jest.fn() }));

const args = [
  new Error("boom"),
  { path: "/", method: "GET", headers: {} },
  {
    routerKind: "App Router",
    routePath: "/",
    routeType: "render",
    renderSource: "server-rendering",
    revalidateReason: undefined,
    renderType: "dynamic",
  },
] as const;

afterEach(() => {
  jest.clearAllMocks();
});

describe("onRequestError", () => {
  it("logs the error and reports it to Sentry", () => {
    onRequestError(...args);
    expect(logRequestError).toHaveBeenCalledWith(...args);
    expect(captureRequestError).toHaveBeenCalledWith(...args);
  });

  it("still reports to Sentry when logging fails", () => {
    (logRequestError as jest.Mock).mockImplementationOnce(() => {
      throw new Error("logger broke");
    });
    expect(() => onRequestError(...args)).toThrow("logger broke");
    expect(captureRequestError).toHaveBeenCalledWith(...args);
  });
});
