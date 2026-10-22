import Papa from "papaparse";
import type { ErrorEvent } from "@sentry/nextjs";
import {
  REDACTED,
  createRateLimiter,
  sanitizeMessage,
  scrubBreadcrumb,
  scrubEvent,
  stripUrl,
} from "@/lib/errorScrubber";

function errorEvent(value: string, extra: Partial<ErrorEvent> = {}): ErrorEvent {
  return {
    type: undefined,
    exception: {
      values: [
        {
          type: "Error",
          value,
          stacktrace: {
            frames: [{ filename: "app:///page.js", lineno: 1, vars: { cell: "secret" } }],
          },
        },
      ],
    },
    ...extra,
  };
}

describe("sanitizeMessage", () => {
  it("redacts a real JSON.parse error, which quotes the input", () => {
    let message = "";
    try {
      JSON.parse('{"salary": 120000, oops}');
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).not.toBe("");
    expect(sanitizeMessage(message)).toBe(REDACTED);
  });

  it("redacts a PapaParse error message", () => {
    const result = Papa.parse('name,email\n"Jane Doe,jane@example.com', { header: true });
    const message = result.errors[0]?.message ?? "";
    expect(message).not.toBe("");
    expect(sanitizeMessage(message)).toBe(REDACTED);
  });

  it("redacts unknown messages that contain user data", () => {
    expect(sanitizeMessage("Unknown column: jane@example.com")).toBe(REDACTED);
    expect(sanitizeMessage("Unknown tool slug: payroll-2026.csv")).toBe(REDACTED);
  });

  it("keeps safe engine messages", () => {
    expect(sanitizeMessage("Cannot read properties of undefined (reading 'length')")).toBe(
      "Cannot read properties of undefined (reading 'length')",
    );
    expect(sanitizeMessage("rows.map is not a function")).toBe("rows.map is not a function");
    expect(sanitizeMessage("Maximum call stack size exceeded")).toBe(
      "Maximum call stack size exceeded",
    );
  });

  it("keeps only the code of a minified React error, not its args", () => {
    expect(
      sanitizeMessage(
        "Minified React error #418; visit https://react.dev/errors/418?args[]=Jane for the full message",
      ),
    ).toBe("Minified React error #418");
  });

  it("keeps our own safe messages", () => {
    expect(sanitizeMessage("Not a valid .xlsx workbook")).toBe("Not a valid .xlsx workbook");
  });

  it("leaves empty values alone", () => {
    expect(sanitizeMessage(undefined)).toBeUndefined();
    expect(sanitizeMessage("")).toBe("");
  });
});

describe("stripUrl", () => {
  it("drops the query string and hash", () => {
    expect(stripUrl("https://csvpreview.com/data/x?name=jane#row-3")).toBe(
      "https://csvpreview.com/data/x",
    );
  });
});

describe("scrubEvent", () => {
  it("redacts the exception value but keeps type and frames", () => {
    const event = scrubEvent(errorEvent("Unexpected token in row: jane@example.com"));
    const exception = event.exception?.values?.[0];
    expect(exception?.value).toBe(REDACTED);
    expect(exception?.type).toBe("Error");
    expect(exception?.stacktrace?.frames?.[0]).toEqual({
      filename: "app:///page.js",
      lineno: 1,
    });
  });

  it("removes the user, extras, and request details", () => {
    const event = scrubEvent(
      errorEvent("x is not defined", {
        user: { ip_address: "1.2.3.4", id: "abc" },
        extra: { fileName: "payroll.csv" },
        request: {
          url: "https://csvpreview.com/?file=payroll.csv",
          headers: { Cookie: "theme=dark", "User-Agent": "test" },
          cookies: { theme: "dark" },
          query_string: "file=payroll.csv",
          data: "a,b,c",
        },
      }),
    );
    expect(event.user).toBeUndefined();
    expect(event.extra).toBeUndefined();
    expect(event.request).toEqual({ url: "https://csvpreview.com/" });
  });

  it("redacts plain messages and log entries", () => {
    const event = scrubEvent({
      type: undefined,
      message: "parsed jane@example.com",
      logentry: { message: "parsed jane@example.com", params: ["x"] },
    });
    expect(event.message).toBe(REDACTED);
    expect(event.logentry).toEqual({ message: REDACTED });
  });

  it("strips the query from the Next.js request path context", () => {
    const event = scrubEvent(
      errorEvent("x is not defined", {
        contexts: { nextjs: { request_path: "/data/x?q=jane", route_type: "render" } },
      }),
    );
    expect(event.contexts?.nextjs).toEqual({ request_path: "/data/x", route_type: "render" });
  });

  it("filters breadcrumbs attached to the event", () => {
    const event = scrubEvent(
      errorEvent("x is not defined", {
        breadcrumbs: [
          { category: "console", message: "row: jane@example.com" },
          { category: "navigation", data: { from: "/?a=1", to: "/about" } },
        ],
      }),
    );
    expect(event.breadcrumbs).toEqual([
      {
        type: undefined,
        category: "navigation",
        level: undefined,
        timestamp: undefined,
        data: { from: "/", to: "/about" },
      },
    ]);
  });
});

describe("scrubBreadcrumb", () => {
  it("drops console, UI, and Sentry breadcrumbs", () => {
    expect(scrubBreadcrumb({ category: "console", message: "cell value" })).toBeNull();
    expect(scrubBreadcrumb({ category: "ui.click", message: "td > span" })).toBeNull();
    expect(scrubBreadcrumb({ category: "sentry.event", message: "old message" })).toBeNull();
    expect(scrubBreadcrumb({ message: "no category" })).toBeNull();
  });

  it("drops server log lines, which hold IPs", () => {
    const line = JSON.stringify({ level: "info", message: "Incoming request", context: { ip: "203.0.113.7" } });
    expect(scrubBreadcrumb({ category: "console", level: "info", message: line })).toBeNull();
  });

  it("keeps network breadcrumbs without the query or message", () => {
    expect(
      scrubBreadcrumb({
        type: "http",
        category: "fetch",
        message: "free text",
        data: {
          url: "/data/x.csv?token=abc",
          method: "GET",
          status_code: 200,
          body: "a,b",
        },
      }),
    ).toEqual({
      type: "http",
      category: "fetch",
      level: undefined,
      timestamp: undefined,
      data: { url: "/data/x.csv", method: "GET", status_code: 200 },
    });
  });
});

describe("createRateLimiter", () => {
  it("allows at most max calls when there is no window", () => {
    const allow = createRateLimiter(2);
    expect([allow(), allow(), allow()]).toEqual([true, true, false]);
  });

  it("resets after the window passes", () => {
    let time = 0;
    const allow = createRateLimiter(1, 1000, () => time);
    expect(allow()).toBe(true);
    expect(allow()).toBe(false);
    time = 1000;
    expect(allow()).toBe(true);
  });
});
