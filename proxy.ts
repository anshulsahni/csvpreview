import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { getRequestLogContext, REQUEST_ID_HEADER } from "@/lib/logger/requestLog";

/**
 * Logs every request that reaches the server, and passes a request ID to the
 * route through the `x-request-id` request header. A header is the only way
 * to hand data from the proxy to the app: the proxy can run apart from the
 * render, so module state or AsyncLocalStorage set here does not reach it.
 */
export function proxy(request: NextRequest, event: NextFetchEvent): NextResponse {
  const requestId = crypto.randomUUID();
  logger.info("Incoming request", getRequestLogContext(request, requestId));
  // Lets an async transport finish after the response is sent.
  event.waitUntil(logger.flush());

  const headers = new Headers(request.headers);
  headers.set(REQUEST_ID_HEADER, requestId);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    /*
     * Every path except:
     * - _next/static, _next/image: build assets and image optimization.
     * - relay: the Sentry tunnel route (`tunnelRoute` in next.config.ts).
     * - static files from public/, by extension.
     * robots.txt, sitemap.xml, and llms.txt are still logged.
     */
    "/((?!_next/static|_next/image|relay(?:/|$)|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|css|js|map)$).*)",
  ],
};
