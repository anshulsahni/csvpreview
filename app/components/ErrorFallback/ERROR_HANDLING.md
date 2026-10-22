# Error handling

This file explains how error handling works in this project and how to test it.

This folder holds the error screen (`ErrorFallback`) that `app/error.tsx` and `app/global-error.tsx` show when a page crashes. When a Sentry DSN is set, the crash is also reported to Sentry.

Use `CrashTestButton.tsx` (in this folder) to test both. Its code is commented out so it never ships.

## Files

| File | What it does |
| --- | --- |
| `ErrorFallback.tsx` | The "Something went wrong" screen |
| `hooks.ts` | `useReportError`: sends the caught error to Sentry once |
| `CrashTestButton.tsx` | Commented-out test button that crashes the page |
| `app/error.tsx` | Catches crashes inside the root layout |
| `app/global-error.tsx` | Catches crashes in the root layout itself |
| `lib/errorTracking.ts` | Starts Sentry. All Sentry calls go through it. |
| `lib/errorScrubber.ts` | Removes user data from every event before it is sent |
| `instrumentation.ts` | `onRequestError`: reports server errors to Sentry, then writes a log line |

## 1. Turn on the test button

1. In `CrashTestButton.tsx`:
   - Delete the line `export {};`.
   - Uncomment the code below it, including the `"use client";` line.
2. In `app/page.tsx`, add the import:

   ```tsx
   import CrashTestButton from "@/app/components/ErrorFallback/CrashTestButton";
   ```

3. In `app/page.tsx`, add the button inside `<main>`, after `<CsvViewer />`:

   ```tsx
   <CrashTestButton />
   ```

## 2. Test the error screen (no Sentry needed)

1. Run `npm run dev` and open http://localhost:3000/.
2. Click the red **Crash this page** button in the bottom-left corner.
3. Check that the page shows:
   - "Something went wrong"
   - A **Try again** button. It re-renders the page and the button comes back.
   - A **Go to Home** link
4. Check that the page does not show the error message (`jane@example.com`).

In dev mode, Next.js also shows its own error badge in the corner. The production build (`npm run build && npm start`) does not show it.

## 3. Test Sentry reporting

You need a Sentry DSN for this.

1. Put the DSN in `.env.local` (do not commit it):

   ```
   NEXT_PUBLIC_SENTRY_DSN=https://<key>@o<org-id>.ingest.sentry.io/<project-id>
   ```

2. Restart `npm run dev`, open http://localhost:3000/, and click **Crash this page**.
3. In the browser DevTools Network tab, check for a `POST` to `/relay?o=...`. This is the tunnel through our own domain.
4. Open the new issue in Sentry and check the event:
   - The message is `[redacted]`, not `jane@example.com,120000`.
   - There is no user, IP address, cookies, or request headers.
   - The URL has no query string.
   - There are no console or click breadcrumbs.
5. Optional: turn on an ad blocker (for example, uBlock Origin) and repeat. The event must still arrive.

To check source maps and the release tag, run the same test on a Vercel preview deploy. That build has `SENTRY_AUTH_TOKEN`. The stack trace must point to `CrashTestButton.tsx`, and the release must be the commit SHA.

## Server errors are also logged

An error on the server (render, route handler, server action, or proxy) also writes one JSON line to the server log, through `lib/logger/requestLog.ts`:

```json
{"timestamp":"…","level":"error","message":"Request failed","context":{"env":"production","requestId":"…","method":"GET","path":"/","routePath":"/","routeType":"render","renderSource":"server-rendering","error":{"name":"Error","message":"[redacted]","stack":"…","digest":"…"}}}
```

- `requestId` matches the `Incoming request` line that `proxy.ts` wrote for the same request.
- The error message uses the same allowlist as Sentry.
- Sentry is called first, so a logging bug can never stop the report.

`CrashTestButton` crashes the page in the browser, so it does not write this line. To see it, throw an error in a Server Component (for example, at the top of `app/about/page.tsx`), run `npm run dev`, open the page, and check the terminal. Remove the throw before you commit.

## 4. Test with no DSN

1. Remove `NEXT_PUBLIC_SENTRY_DSN` from `.env.local` and restart.
2. Click **Crash this page**.
3. The error screen still shows, and the Network tab has no request to `/relay` or `sentry.io`.

## 5. Turn the test button off again

Before you commit:

1. Remove the import and `<CrashTestButton />` from `app/page.tsx`.
2. Comment out the code in `CrashTestButton.tsx` again, and put back `export {};`.

Run `git diff app/page.tsx` to check that nothing is left.
