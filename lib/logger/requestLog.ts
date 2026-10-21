import type { Instrumentation } from "next";
import { stripUrl } from "@/lib/errorScrubber";
import { logger } from "@/lib/logger";

/** Carries the proxy's request ID to the route and to `onRequestError`. */
export const REQUEST_ID_HEADER = "x-request-id";

/**
 * What kind of request reached the server:
 * - `action`: a server action call.
 * - `document`: a full page load in a browser.
 * - `fetch`: a `fetch()` from the page, which is how the client router sends
 *   navigations and prefetches.
 * - `other`: no browser hint, for example bots, crawlers, and curl.
 *
 * Next strips its router headers (`rsc`, `next-router-prefetch`, ...) before
 * the proxy runs, so the browser's `sec-fetch-dest` header is used instead.
 */
export type RequestKind = "action" | "document" | "fetch" | "other";

export interface RequestLogContext {
  requestId: string;
  method: string;
  path: string;
  kind: RequestKind;
  userAgent?: string;
  country?: string;
  referrerHost?: string;
  ip?: string;
  vercelId?: string;
  [key: string]: unknown;
}

/** Read a header, treating an empty value as missing. */
function readHeader(headers: Headers, name: string): string | undefined {
  return headers.get(name) || undefined;
}

export function getRequestKind(headers: Headers): RequestKind {
  if (headers.has("next-action")) return "action";
  const destination = headers.get("sec-fetch-dest");
  if (destination === "document") return "document";
  if (destination === "empty") return "fetch";
  return "other";
}

/** Only the host of the referrer, never its path or query. */
export function getReferrerHost(referrer: string | undefined): string | undefined {
  if (!referrer) return undefined;
  try {
    return new URL(referrer).host || undefined;
  } catch {
    return undefined;
  }
}

/** The first `x-forwarded-for` entry is the client; fall back to `x-real-ip`. */
export function getClientIp(headers: Headers): string | undefined {
  const forwarded = readHeader(headers, "x-forwarded-for")?.split(",")[0].trim();
  return forwarded || readHeader(headers, "x-real-ip");
}

/** Pure: the fields logged for one incoming request. The query string is never read. */
export function getRequestLogContext(request: Request, requestId: string): RequestLogContext {
  const { headers } = request;
  return {
    requestId,
    method: request.method,
    path: new URL(request.url).pathname,
    kind: getRequestKind(headers),
    userAgent: readHeader(headers, "user-agent"),
    country: readHeader(headers, "x-vercel-ip-country"),
    referrerHost: getReferrerHost(readHeader(headers, "referer")),
    ip: getClientIp(headers),
    vercelId: readHeader(headers, "x-vercel-id"),
  };
}

type OnRequestErrorArgs = Parameters<Instrumentation.onRequestError>;

/** Log a server error reported to `onRequestError`. Never throws. */
export function logRequestError(
  error: OnRequestErrorArgs[0],
  request: OnRequestErrorArgs[1],
  context: OnRequestErrorArgs[2],
): void {
  try {
    const header = request.headers[REQUEST_ID_HEADER];
    const requestId = Array.isArray(header) ? header[0] : header;
    logger.error("Request failed", {
      requestId,
      method: request.method,
      path: stripUrl(request.path),
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
      error,
    });
  } catch {
    // Logging must never change how Next.js handles the error.
  }
}
