/**
 * @jest-environment node
 */
import { logger } from "@/lib/logger";
import {
  getClientIp,
  getReferrerHost,
  getRequestKind,
  getRequestLogContext,
  logRequestError,
  REQUEST_ID_HEADER,
} from "@/lib/logger/requestLog";

function request(path: string, headers: Record<string, string> = {}, method = "GET"): Request {
  return new Request(`https://csvpreview.com${path}`, { method, headers });
}

describe("getRequestLogContext", () => {
  it("logs the path without the query string", () => {
    const context = getRequestLogContext(request("/data/finance/sp500?q=jane#top"), "id-1");
    expect(context.path).toBe("/data/finance/sp500");
    expect(JSON.stringify(context)).not.toContain("jane");
  });

  it("collects every field from the headers", () => {
    const context = getRequestLogContext(
      request(
        "/",
        {
          "user-agent": "Mozilla/5.0",
          "x-vercel-ip-country": "IN",
          referer: "https://www.google.com/search?q=csv",
          "x-forwarded-for": "203.0.113.7, 10.0.0.1",
          "x-vercel-id": "bom1::abc",
        },
        "POST",
      ),
      "id-1",
    );
    expect(context).toEqual({
      requestId: "id-1",
      method: "POST",
      path: "/",
      kind: "other",
      userAgent: "Mozilla/5.0",
      country: "IN",
      referrerHost: "www.google.com",
      ip: "203.0.113.7",
      vercelId: "bom1::abc",
    });
  });

  it("leaves missing headers undefined", () => {
    const context = getRequestLogContext(request("/"), "id-1");
    expect(JSON.parse(JSON.stringify(context))).toEqual({
      requestId: "id-1",
      method: "GET",
      path: "/",
      kind: "other",
    });
  });
});

describe("getRequestKind", () => {
  it.each([
    [{ "next-action": "abc", "sec-fetch-dest": "empty" }, "action"],
    [{ "sec-fetch-dest": "document" }, "document"],
    [{ "sec-fetch-dest": "empty" }, "fetch"],
    [{ "sec-fetch-dest": "image" }, "other"],
    [{}, "other"],
  ])("detects %j as %s", (headers, kind) => {
    expect(getRequestKind(new Headers(headers))).toBe(kind);
  });
});

describe("getReferrerHost", () => {
  it("keeps only the host", () => {
    expect(getReferrerHost("https://news.ycombinator.com/item?id=1")).toBe("news.ycombinator.com");
  });

  it("returns undefined for a missing or bad referrer", () => {
    expect(getReferrerHost(undefined)).toBeUndefined();
    expect(getReferrerHost("not a url")).toBeUndefined();
  });
});

describe("getClientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": " 203.0.113.7 , 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
  });

  it("returns undefined without either header", () => {
    expect(getClientIp(new Headers())).toBeUndefined();
  });
});

describe("logRequestError", () => {
  const context = {
    routerKind: "App Router",
    routePath: "/data/[category]/[slug]",
    routeType: "render",
    renderSource: "react-server-components",
    revalidateReason: undefined,
    renderType: "dynamic",
  } as const;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs the error with the request ID and a query-free path", () => {
    const spy = jest.spyOn(logger, "error").mockImplementation(() => {});
    const error = new Error("boom");
    logRequestError(
      error,
      { path: "/data/finance/sp500?q=jane", method: "GET", headers: { [REQUEST_ID_HEADER]: "id-1" } },
      context,
    );
    expect(spy).toHaveBeenCalledWith("Request failed", {
      requestId: "id-1",
      method: "GET",
      path: "/data/finance/sp500",
      routePath: "/data/[category]/[slug]",
      routeType: "render",
      renderSource: "react-server-components",
      error,
    });
  });

  it("uses the first value when the header repeats", () => {
    const spy = jest.spyOn(logger, "error").mockImplementation(() => {});
    logRequestError(
      new Error("boom"),
      { path: "/", method: "GET", headers: { [REQUEST_ID_HEADER]: ["id-1", "id-2"] } },
      context,
    );
    expect(spy.mock.calls[0][1]).toMatchObject({ requestId: "id-1" });
  });

  it("never throws", () => {
    jest.spyOn(logger, "error").mockImplementation(() => {
      throw new Error("logger broke");
    });
    expect(() =>
      logRequestError(new Error("boom"), { path: "/", method: "GET", headers: {} }, context),
    ).not.toThrow();
  });
});
