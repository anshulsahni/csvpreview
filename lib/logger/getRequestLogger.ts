import { cache } from "react";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { logger, type Logger } from "@/lib/logger";
import { REQUEST_ID_HEADER } from "./requestLog";

/**
 * The app logger with this request's ID bound to every record. Call it from
 * any server code, at any depth; nothing needs to be passed down.
 *
 * `headers()` reads from Next's own per-request storage, and React `cache()`
 * makes one child logger per request. Outside a request (build time,
 * `register()`) `headers()` throws, so the plain logger is returned.
 * Next's own control-flow errors (for example the dynamic-rendering signal
 * during prerender) are rethrown so Next can handle them.
 *
 * Kept apart from `requestLog.ts` so `proxy.ts` never imports `next/headers`.
 */
export const getRequestLogger = cache(async (): Promise<Logger> => {
  try {
    const requestId = (await headers()).get(REQUEST_ID_HEADER);
    return requestId ? logger.child({ requestId }) : logger;
  } catch (error) {
    unstable_rethrow(error);
    return logger;
  }
});
