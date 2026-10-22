import { serializeContext, type SerializeOptions } from "./serialize";
import { consoleTransport } from "./transports";
import type {
  LogContext,
  Logger,
  LoggerOptions,
  LogLevel,
  LogLevelSetting,
  LogRecord,
} from "./types";

const LEVEL_RANK: Record<LogLevelSetting, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: Infinity,
};

/**
 * Create a structured JSON logger. Every record passes through one `write`
 * function, so redaction, new transports, or global context can be added in
 * one place. A log call never throws: a logging bug must not break a request.
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const {
    level = "info",
    context: baseContext = {},
    transports = [consoleTransport],
    redactKeys = [],
    sanitizeErrorMessage,
    now = () => new Date(),
  } = options;

  const minRank = LEVEL_RANK[level];
  const serializeOptions: SerializeOptions = {
    redactKeys: new Set(redactKeys),
    sanitizeErrorMessage,
  };
  // Shared by every child, so one `flush()` waits for all of them.
  const pending = new Set<Promise<void>>();

  function buildRecord(
    recordLevel: LogLevel,
    message: string,
    context: LogContext,
  ): LogRecord {
    const record: LogRecord = {
      timestamp: now().toISOString(),
      level: recordLevel,
      message: String(message),
    };
    const serialized = serializeContext(context, serializeOptions);
    if (Object.keys(serialized).length > 0) record.context = serialized;
    return record;
  }

  function track(result: Promise<void>): void {
    const settled: Promise<void> = Promise.resolve(result)
      .catch(() => {})
      .then(() => {
        pending.delete(settled);
      });
    pending.add(settled);
  }

  function write(
    recordLevel: LogLevel,
    message: string,
    bound: LogContext,
    context?: LogContext,
  ): void {
    if (LEVEL_RANK[recordLevel] < minRank) return;

    let record: LogRecord;
    try {
      record = buildRecord(recordLevel, message, { ...bound, ...context });
    } catch {
      return;
    }

    for (const transport of transports) {
      try {
        const result = transport(record);
        if (result instanceof Promise) track(result);
      } catch {
        // One broken transport must not stop the others.
      }
    }
  }

  function build(bound: LogContext): Logger {
    return {
      debug: (message, context) => write("debug", message, bound, context),
      info: (message, context) => write("info", message, bound, context),
      warn: (message, context) => write("warn", message, bound, context),
      error: (message, context) => write("error", message, bound, context),
      child: (context) => build({ ...bound, ...context }),
      flush: async () => {
        await Promise.all(pending);
      },
    };
  }

  return build(baseContext);
}
