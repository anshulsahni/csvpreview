import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";

/**
 * Pure helpers that remove user data from Sentry events before they leave
 * the browser or the server. Nothing here talks to Sentry; it only reshapes
 * events, so it is safe to unit-test and to reuse.
 *
 * The rule is "deny by default": an error message is replaced unless it
 * matches a known-safe pattern. Parser errors (PapaParse, `JSON.parse`) quote
 * the input they failed on, and that input is the user's CSV.
 */

export const REDACTED = "[redacted]";

/**
 * Engine and framework messages that never contain user data. Each pattern
 * is anchored at the start; the matched part is what we keep, so a pattern
 * without a `$` anchor keeps only its prefix (e.g. the React error code, not
 * the args that follow it).
 */
const SAFE_MESSAGE_PATTERNS: RegExp[] = [
  /^Cannot (read|set) propert(y|ies) of (undefined|null)( \((reading|setting) '[\w$]+'\))?$/,
  /^[\w$.]+ is not (a function|defined|iterable|a constructor)$/,
  /^Maximum call stack size exceeded$/,
  /^Minified React error #\d+/,
  /^Loading (CSS )?chunk [\w-]+ failed/,
  /^Failed to fetch( \([\w.-]+\))?$/,
  /^Load failed$/,
  /^NetworkError when attempting to fetch resource\.$/,
  /^The (operation|user) (was|aborted)[\w .]*$/,
];

/** Messages thrown by our own code that carry no user data. */
const SAFE_APP_MESSAGES = new Set<string>([
  "Could not read file",
  "Invalid dataset slug",
  "Not a valid .xlsx workbook",
  "rows and sourceIndices length mismatch",
  "useTheme must be used within a ThemeProvider",
  "useToast must be used within a ToastProvider",
]);

/** Keep a message only if it is known to be safe; otherwise redact it. */
export function sanitizeMessage(message: string | undefined): string | undefined {
  if (message === undefined || message === "") return message;
  if (SAFE_APP_MESSAGES.has(message)) return message;
  for (const pattern of SAFE_MESSAGE_PATTERNS) {
    const match = pattern.exec(message);
    if (match) return match[0];
  }
  return REDACTED;
}

/** Drop the query string and hash, which can carry arbitrary data. */
export function stripUrl(url: string): string {
  return url.split(/[?#]/)[0];
}

/** Breadcrumb categories that can hold logged values, DOM text, or old event messages. */
function isUnsafeCategory(category: string | undefined): boolean {
  if (!category) return true;
  return (
    category === "console" ||
    category.startsWith("ui.") ||
    category.startsWith("sentry.")
  );
}

/**
 * `beforeBreadcrumb`: keep only navigation and network breadcrumbs, with
 * their URLs stripped and no free-text message.
 */
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  if (isUnsafeCategory(breadcrumb.category)) return null;

  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(breadcrumb.data ?? {})) {
    if (key === "url" || key === "from" || key === "to") {
      if (typeof value === "string") data[key] = stripUrl(value);
    } else if (typeof value === "number" || key === "method") {
      data[key] = value;
    }
  }

  return {
    type: breadcrumb.type,
    category: breadcrumb.category,
    level: breadcrumb.level,
    timestamp: breadcrumb.timestamp,
    data,
  };
}

/**
 * `beforeSend`: redact messages, and remove the user, request details, and
 * free-form extras. Keeps the exception type and stack frames, which are
 * what we need to find the bug.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  for (const exception of event.exception?.values ?? []) {
    exception.value = sanitizeMessage(exception.value);
    for (const frame of exception.stacktrace?.frames ?? []) {
      delete frame.vars;
    }
  }

  if (event.message !== undefined) {
    event.message = sanitizeMessage(event.message);
  }
  if (event.logentry) {
    event.logentry = { message: sanitizeMessage(event.logentry.message) };
  }

  delete event.user;
  delete event.extra;

  if (event.request) {
    event.request = event.request.url
      ? { url: stripUrl(event.request.url) }
      : {};
  }

  const nextjsContext = event.contexts?.nextjs;
  if (nextjsContext && typeof nextjsContext.request_path === "string") {
    nextjsContext.request_path = stripUrl(nextjsContext.request_path);
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs
      .map(scrubBreadcrumb)
      .filter((crumb): crumb is Breadcrumb => crumb !== null);
  }

  return event;
}

/**
 * Returns a function that allows at most `max` calls per `windowMs`.
 * With the default window, the limit lasts for the life of the page.
 * Used so one error loop cannot spend the whole monthly quota.
 */
export function createRateLimiter(
  max: number,
  windowMs: number = Infinity,
  now: () => number = Date.now,
): () => boolean {
  let windowStart = now();
  let count = 0;

  return function allow(): boolean {
    const current = now();
    if (current - windowStart >= windowMs) {
      windowStart = current;
      count = 0;
    }
    if (count >= max) return false;
    count += 1;
    return true;
  };
}
