import type { LogContext } from "./types";

/**
 * Pure helpers that turn log context into JSON-safe data. Plain
 * `JSON.stringify` loses errors (`{}`), throws on `BigInt` and on circular
 * references, and can produce huge lines from deep objects. These helpers
 * handle all of that so a log call never throws.
 */

export const REDACTED = "[REDACTED]";
export const CIRCULAR = "[Circular]";
export const TRUNCATED = "[Truncated]";

/** Objects nested deeper than this are replaced with `[Truncated]`. */
export const DEFAULT_MAX_DEPTH = 5;

export interface SerializeOptions {
  redactKeys?: ReadonlySet<string>;
  sanitizeErrorMessage?: (message: string) => string | undefined;
  maxDepth?: number;
}

export interface SerializedError {
  name: string;
  message?: string;
  stack?: string;
  digest?: string;
  cause?: unknown;
}

/** Turn an `Error` into a plain object, keeping the Next.js `digest`. */
export function serializeError(
  error: Error,
  options: SerializeOptions = {},
  ancestors: Set<object> = new Set(),
  depth = 0,
): SerializedError {
  const message = options.sanitizeErrorMessage
    ? options.sanitizeErrorMessage(error.message)
    : error.message;

  const result: SerializedError = { name: error.name };
  if (message !== undefined && message !== "") result.message = message;

  if (typeof error.stack === "string") {
    // The first stack line repeats the message, so redact it there too.
    result.stack =
      error.message && message !== error.message
        ? error.stack.replace(error.message, message ?? "")
        : error.stack;
  }

  const digest: unknown = (error as { digest?: unknown }).digest;
  if (typeof digest === "string") result.digest = digest;

  if (error.cause !== undefined) {
    const cause = serializeValue(error.cause, options, ancestors, depth + 1);
    if (cause !== undefined) result.cause = cause;
  }

  return result;
}

/**
 * Turn any value into JSON-safe data. Returns `undefined` for values JSON
 * drops (functions, symbols, `undefined`), so callers can omit them.
 */
export function serializeValue(
  value: unknown,
  options: SerializeOptions = {},
  ancestors: Set<object> = new Set(),
  depth = 0,
): unknown {
  if (value === null) return null;

  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
      return value;
    case "bigint":
      return value.toString();
    case "undefined":
    case "function":
    case "symbol":
      return undefined;
  }

  const object = value as object;
  if (ancestors.has(object)) return CIRCULAR;
  if (depth >= (options.maxDepth ?? DEFAULT_MAX_DEPTH)) return TRUNCATED;

  if (object instanceof Date) {
    return Number.isNaN(object.getTime()) ? "Invalid Date" : object.toISOString();
  }

  // Track only the current path, so an object referenced twice side by side
  // is written twice instead of being reported as circular.
  ancestors.add(object);
  try {
    if (object instanceof Error) {
      return serializeError(object, options, ancestors, depth);
    }
    if (Array.isArray(object)) {
      return object.map((item) => {
        const serialized = serializeValue(item, options, ancestors, depth + 1);
        return serialized === undefined ? null : serialized;
      });
    }
    return serializeEntries(object as Record<string, unknown>, options, ancestors, depth);
  } finally {
    ancestors.delete(object);
  }
}

function serializeEntries(
  object: Record<string, unknown>,
  options: SerializeOptions,
  ancestors: Set<object>,
  depth: number,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(object)) {
    if (options.redactKeys?.has(key)) {
      result[key] = REDACTED;
      continue;
    }
    const serialized = serializeValue(item, options, ancestors, depth + 1);
    if (serialized !== undefined) result[key] = serialized;
  }
  return result;
}

/** Serialize the context of one log record. The top level counts as depth 0. */
export function serializeContext(
  context: LogContext,
  options: SerializeOptions = {},
): Record<string, unknown> {
  return serializeEntries(context, options, new Set([context]), 0);
}
