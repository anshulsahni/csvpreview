import { sanitizeMessage } from "@/lib/errorScrubber";
import { createLogger } from "./createLogger";
import type { LogLevelSetting } from "./types";

export { createLogger } from "./createLogger";
export { consoleTransport, createMemoryTransport } from "./transports";
export type { MemoryTransport } from "./transports";
export type {
  LogContext,
  Logger,
  LoggerOptions,
  LogLevel,
  LogLevelSetting,
  LogRecord,
  Transport,
} from "./types";

/** Minimum level per environment. Tests stay quiet unless they opt in. */
export function getLogLevel(nodeEnv: string | undefined): LogLevelSetting {
  if (nodeEnv === "production") return "info";
  if (nodeEnv === "test") return "silent";
  return "debug";
}

/**
 * The app's server-side logger. Server code only: Server Components, route
 * handlers, server actions, `proxy.ts`, and `instrumentation.ts`. Error
 * messages go through the same allowlist as Sentry, so user data that ends
 * up in an error message is never written.
 */
export const logger = createLogger({
  level: getLogLevel(process.env.NODE_ENV),
  context: { env: process.env.NODE_ENV ?? "development" },
  sanitizeErrorMessage: sanitizeMessage,
});
