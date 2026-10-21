import type { BrowserOptions, ErrorEvent, EventHint } from "@sentry/nextjs";

jest.mock("@sentry/nextjs", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureRequestError: jest.fn(),
}));

type ErrorTrackingModule = typeof import("@/lib/errorTracking");
type SentryMock = {
  init: jest.Mock;
  captureException: jest.Mock;
  captureRequestError: jest.Mock;
};

const ORIGINAL_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

/** Load fresh copies so each test sees its own DSN and init state. */
function load(dsn: string | undefined): { tracking: ErrorTrackingModule; sentry: SentryMock } {
  if (dsn === undefined) delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  else process.env.NEXT_PUBLIC_SENTRY_DSN = dsn;

  let tracking!: ErrorTrackingModule;
  let sentry!: SentryMock;
  jest.isolateModules(() => {
    tracking = jest.requireActual("@/lib/errorTracking");
    sentry = jest.requireMock("@sentry/nextjs");
  });
  return { tracking, sentry };
}

afterEach(() => {
  jest.clearAllMocks();
  if (ORIGINAL_DSN === undefined) delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  else process.env.NEXT_PUBLIC_SENTRY_DSN = ORIGINAL_DSN;
});

const DSN = "https://key@o1.ingest.sentry.io/2";

describe("without a DSN", () => {
  it("never initializes Sentry and ignores captures", () => {
    const { tracking, sentry } = load(undefined);
    tracking.initClientErrorTracking();
    tracking.initServerErrorTracking();
    tracking.captureError(new Error("boom"));
    expect(sentry.init).not.toHaveBeenCalled();
    expect(sentry.captureException).not.toHaveBeenCalled();
  });
});

describe("initClientErrorTracking", () => {
  function initClient(): { options: BrowserOptions; sentry: SentryMock } {
    const { tracking, sentry } = load(DSN);
    tracking.initClientErrorTracking();
    tracking.initClientErrorTracking();
    expect(sentry.init).toHaveBeenCalledTimes(1);
    return { options: sentry.init.mock.calls[0][0], sentry };
  }

  it("turns off all automatic data collection", () => {
    expect(initClient().options.dataCollection).toEqual({
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
    });
  });

  it("removes the console, session, and tracing integrations", () => {
    const { options } = initClient();
    const integrations = options.integrations as (
      defaults: { name: string }[],
    ) => { name: string }[];
    const result = integrations([
      { name: "Console" },
      { name: "BrowserSession" },
      { name: "BrowserTracing" },
      { name: "Breadcrumbs" },
      { name: "GlobalHandlers" },
    ]);
    expect(result).toEqual([{ name: "Breadcrumbs" }, { name: "GlobalHandlers" }]);
  });

  it("scrubs events and stops after the per-page limit", () => {
    const beforeSend = initClient().options.beforeSend as (
      event: ErrorEvent,
      hint: EventHint,
    ) => ErrorEvent | null;
    const makeEvent = (): ErrorEvent => ({
      type: undefined,
      user: { id: "1" },
      exception: { values: [{ type: "SyntaxError", value: "bad row: jane" }] },
    });

    const first = beforeSend(makeEvent(), {});
    expect(first?.user).toBeUndefined();
    expect(first?.exception?.values?.[0].value).toBe("[redacted]");

    for (let i = 1; i < 10; i += 1) beforeSend(makeEvent(), {});
    expect(beforeSend(makeEvent(), {})).toBeNull();
  });
});

describe("captureError", () => {
  it("reports once Sentry is initialized", () => {
    const { tracking, sentry } = load(DSN);
    const error = new Error("boom");
    tracking.initClientErrorTracking();
    tracking.captureError(error);
    expect(sentry.captureException).toHaveBeenCalledWith(error);
  });
});
