/**
 * @jest-environment node
 */
import { NextRequest, type NextFetchEvent } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { logger } from "@/lib/logger";
import { REQUEST_ID_HEADER } from "@/lib/logger/requestLog";
import { config, proxy } from "@/proxy";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("proxy matcher", () => {
  it.each(["/", "/data/finance/sp500", "/tools/csv-to-excel", "/robots.txt", "/sitemap.xml", "/llms.txt", "/relayed-page"])(
    "logs %s",
    (url) => {
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
    },
  );

  it.each([
    "/_next/static/chunks/main.js",
    "/_next/image?url=%2Fbrand%2Flogo.png&w=64&q=75",
    "/brand/logo.png",
    "/favicon.ico",
    "/fonts/inter.woff2",
    "/relay",
    "/relay?o=123&p=456",
  ])("skips %s", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false);
  });
});

describe("proxy", () => {
  function run(path: string) {
    const info = jest.spyOn(logger, "info").mockImplementation(() => {});
    const waitUntil = jest.fn();
    const response = proxy(new NextRequest(`https://csvpreview.com${path}`), {
      waitUntil,
    } as unknown as NextFetchEvent);
    return { info, waitUntil, response };
  }

  it("logs one record per request", () => {
    const { info } = run("/about?ref=x");
    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith(
      "Incoming request",
      expect.objectContaining({ method: "GET", path: "/about", kind: "other" }),
    );
  });

  it("forwards the logged request ID to the route", () => {
    const { info, response } = run("/");
    const { requestId } = info.mock.calls[0][1] as { requestId: string };
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
    // NextResponse.next({ request: { headers } }) encodes overridden request
    // headers on the response for Next to apply.
    expect(response.headers.get(`x-middleware-request-${REQUEST_ID_HEADER}`)).toBe(requestId);
  });

  it("keeps the proxy alive until the logs are flushed", () => {
    const { waitUntil } = run("/");
    expect(waitUntil).toHaveBeenCalledWith(expect.any(Promise));
  });
});
