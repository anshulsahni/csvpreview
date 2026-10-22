/** Severity of a log record, lowest first. */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** The minimum level a logger writes. `silent` writes nothing. */
export type LogLevelSetting = LogLevel | "silent";

/** Free-form data attached to a log record. */
export type LogContext = Record<string, unknown>;

/** One structured log line, as written by every transport. */
export interface LogRecord {
  timestamp: string;
  level: LogLevel;
  message: string;
  /** Omitted when there is no context to write. */
  context?: Record<string, unknown>;
}

/**
 * An output target. A transport may return a promise; `Logger.flush()`
 * waits for it, so async transports can finish before a request ends.
 */
export type Transport = (record: LogRecord) => void | Promise<void>;

export interface LoggerOptions {
  /** Records below this level are dropped. Defaults to `info`. */
  level?: LogLevelSetting;
  /** Context bound to every record from this logger. */
  context?: LogContext;
  /** Where records go. Defaults to `[consoleTransport]`. */
  transports?: Transport[];
  /** Keys whose values are replaced with `[REDACTED]`, at any depth. */
  redactKeys?: string[];
  /** Rewrites every error message before it is written. */
  sanitizeErrorMessage?: (message: string) => string | undefined;
  /** Clock used for `timestamp`. Defaults to the current time. */
  now?: () => Date;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  /** A logger that adds `context` to every record. Call-site context wins. */
  child(context: LogContext): Logger;
  /** Resolves once every pending async transport call has settled. */
  flush(): Promise<void>;
}
