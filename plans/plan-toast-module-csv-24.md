# CSV-24 — Toast Notification Module

## Context

CSV Preview needs a **centralised toast framework** so any module can surface errors or success feedback to the user without each feature re-inventing its own popup. Today the only feedback mechanism is a one-off, locally-positioned "Copied!" toast baked into `CopyControl` (CSV-8). This task generalises that into a reusable, theme-aware, animated toast system driven by a React Context + `useToast()` hook — mirroring the app's existing provider conventions (`ThemeProvider`, `KeyboardShortcutsProvider`).

The module is also designed to be **extractable into a standalone open-source library** later: it imports nothing app-specific. Cross-cutting concerns (analytics) are injected from the outside via an optional callback prop.

**Linear issue:** CSV-24 (High priority, Todo). Branch: `zeroansh/csv-24-implement-a-toast-module-which-we-will-use-for-showing`.

### Requirements (from the issue + clarifications)
- Toasts appear **bottom-right**, **slide in from the bottom** ("mail arriving" feel).
- Support **error** and **success** (positive feedback) variants, theme-aware / aesthetic.
- **Auto-dismiss after 5 seconds** (default; per-toast override allowed).
- User can **manually dismiss** via a close button before timeout.
- **Tab-away guarding:** if the document is hidden when a toast is requested, it must **not** appear until the user returns to the tab (Page Visibility API).
- **Pause-on-hover:** countdown pauses while the pointer is over a toast.
- **Analytics:** emitted via an injected callback (see decoupling note), not imported inside the module.
- Centralised **React Context**, triggerable from anywhere via a **hook**.
- **Migrate copy feedback** to the new global toast (remove the local toast from `CopyControl`).

## Decisions (confirmed with user)
- Migrate `CopyControl` copy feedback to the global toast (bottom-right). ✅
- Default duration: **5s**. ✅
- Extras: **pause-on-hover** + **analytics tracking**. (No ESC-to-dismiss for now.) ✅
- **Analytics stays decoupled (plug-n-play).** The Toast module must NOT import `@/lib/analytics` or anything app-specific, so it can be open-sourced as an independent, dependency-free library. Analytics is injected via an optional `onEvent` callback prop on `ToastProvider`; the app wires Mixpanel in from outside (in `app/layout.tsx`). ✅

## Approach

Build a new shared component package `app/components/Toast/` following the §1.2 structure (render-only component, behavior in `hooks.ts`, barrel `index.ts`). It exposes a `ToastProvider` (context, holds the toast queue + visibility gating) and a `useToast()` hook returning imperative helpers. A `ToastViewport` renders the stack bottom-right; each `ToastItem` owns its own timer + hover-pause.

**Decoupling principle:** the module depends only on `react` and `@linaria/react`. It emits lifecycle events through an optional `onEvent` callback prop — it has zero knowledge of Mixpanel/analytics. The app supplies a thin adapter at the wiring site.

### New files

```
app/components/Toast/
├── ToastProvider.tsx     # Context + provider (mirrors ThemeProvider.tsx); accepts optional onEvent prop
├── ToastViewport.tsx     # fixed bottom-right container, maps queue -> ToastItem
├── ToastItem.tsx         # single toast: render + slide-in animation + close button
├── hooks.ts              # useToastProvider() (queue/timer/visibility logic) + useToast() consumer hook + pure helpers
├── types.ts              # ToastVariant, ToastOptions, Toast, ToastEvent, ToastContextValue, ToastProviderProps
└── index.ts              # barrel: export { ToastProvider, useToast }, export type {...}
```

### `types.ts`
```ts
export type ToastVariant = "success" | "error" | "info";

export interface ToastOptions {
  variant?: ToastVariant;     // default "info"
  durationMs?: number;        // default 5000; <=0 means sticky (manual dismiss only)
}

export interface Toast {
  id: string;                 // crypto.randomUUID()
  message: string;
  variant: ToastVariant;
  durationMs: number;
}

// Lifecycle events the host app can subscribe to (analytics, logging, etc.)
// Kept generic & app-agnostic so the module stays dependency-free.
export type ToastEvent =
  | { type: "shown"; toast: Toast }
  | { type: "dismissed"; toast: Toast; reason: "auto" | "manual" };

export interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, options?: ToastOptions) => string; // returns id
  success: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  error: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  dismissToast: (id: string) => void;
}

export interface ToastProviderProps {
  children: ReactNode;
  /** Optional sink for lifecycle events. The app plugs analytics in here. */
  onEvent?: (event: ToastEvent) => void;
}
```

### `hooks.ts` — behavior
- `DEFAULT_DURATION_MS = 5000`.
- `useToastProvider(onEvent?)` owns:
  - `toasts` state array.
  - **Visibility gating:** a `pendingRef` queue. `showToast()` builds the toast; if `document.visibilityState === "hidden"`, push to `pendingRef` instead of state. A `visibilitychange` listener flushes `pendingRef` into `toasts` when the tab becomes visible. (Guard for SSR: only touch `document` inside effects / event handlers — provider is `"use client"`.)
  - `dismissToast(id, reason)` removes from state.
  - Convenience `success`/`error` wrappers over `showToast`.
  - **Event emission (decoupled):** invoke `onEvent?.({ type: "shown", toast })` when a toast actually becomes visible, and `onEvent?.({ type: "dismissed", toast, reason })` on removal (`auto` for timeout, `manual` for close button). Keep `onEvent` in a ref so the callback identity doesn't force re-subscription. **No import of `@/lib/analytics` anywhere in this folder.**
- `useToast()` = `useContext` consumer with the "must be used within ToastProvider" guard (same pattern as `useTheme`).
- Per-item timer + pause-on-hover lives in `ToastItem` (local `useEffect` timer keyed off a `paused` state; clear on unmount — mirror the `resetTimer` cleanup pattern already in `CopyControl.tsx`). Export a pure helper if any computation is worth unit-testing (e.g. `resolveVariant`/`resolveDuration`).

### `ToastProvider.tsx`
- `"use client"`, signature `ToastProvider({ children, onEvent }: ToastProviderProps)`.
- Calls `useToastProvider(onEvent)`, provides the context value, and renders `{children}` followed by `<ToastViewport />` (like `ThemeProvider` renders `ThemeToggle`).

### `ToastViewport.tsx`
- `position: fixed; bottom; right;` stack with `z-index: 9999` (matches existing `Toast` z-index in `CopyControl`). `display: flex; flex-direction: column; gap`. `pointer-events: none` on container, `pointer-events: auto` on items so the page stays interactive.
- Renders nothing when `toasts` is empty.

### `ToastItem.tsx`
- `role="status"` (success/info) / `role="alert"` (error) for a11y; `aria-live` region semantics.
- **Close button:** semantic `<button>` with `aria-label="Dismiss notification"` (per §1.6 — no click handlers on non-buttons).
- **Linaria** `styled` with theme tokens. Slide-in keyframes from below (translateY) + fade, mirroring the `fadeInUp` keyframe already in `CopyControl.tsx`. Variant colors via `&[data-variant="..."]` and the new tokens below.
- `onMouseEnter`/`onMouseLeave` toggle `paused` to pause/resume the dismiss timer.

> Note on theming for a future standalone lib: the module reads CSS custom properties (`var(--success, …)`) with sensible inline fallbacks, so it renders correctly even with no tokens defined — consumers can theme it via the same vars. This keeps it portable without an app dependency.

### Theme tokens (`app/globals.css`)
`--success` / `--error` are currently referenced only as inline fallbacks in `CopyControl.tsx` and are **not defined**. Add real tokens to `:root` so toasts are theme-aware:
```css
--success: light-dark(#16a34a, #22c55e);
--error:   light-dark(#dc2626, #ef4444);
--info:    light-dark(#0070f3, #3b82f6);
```
(Reuse `--info`/`--primary` for the neutral variant.)

### Wiring the provider — `app/layout.tsx`
Add `ToastProvider` to the provider stack so `useToast()` is available app-wide. Place it inside `ThemeProvider` (needs theme tokens) and wrapping the interactive tree. **This is the single integration point where analytics is plugged in** via the `onEvent` adapter — so the module itself never imports `track`:

```tsx
// app/layout.tsx already has "use client" children; the onEvent adapter is the
// only place Toast events meet Mixpanel. (If passing a function from a Server
// Component is awkward, wrap this adapter in a tiny "use client" component, e.g.
// app/components/Toast/AnalyticsBridge or inline in an existing client provider.)
<ThemeProvider initialTheme={theme}>
  <ToastProvider
    onEvent={(e) => {
      if (e.type === "shown") track("Toast Shown", { variant: e.toast.variant });
      else track("Toast Dismissed", { variant: e.toast.variant, reason: e.reason });
    }}
  >
    <KeyboardShortcutsProvider>
      <AnalyticsProvider>{children}</AnalyticsProvider>
    </KeyboardShortcutsProvider>
    <ThemeToggle />
  </ToastProvider>
</ThemeProvider>
```

`track` is imported from `@/lib/analytics` **here in the app**, not in the module. Since `layout.tsx` is a Server Component, the `onEvent` adapter (a function) must live in a client boundary — implement it as a small `"use client"` wrapper around `ToastProvider` (e.g. `app/components/Toast/ToastAnalyticsProvider.tsx`) that supplies the `onEvent` prop, keeping the core `ToastProvider` analytics-free.

### Migrate copy feedback — `app/components/CsvViewer/CopyControl.tsx`
- Remove local `copyStatus`, `toastCoords`, `resetTimer`, the `Toast` styled block, the positioned `<Toast>` JSX, and the `getBoundingClientRect` logic.
- In `triggerCopy`, call `const { success, error } = useToast();` and emit `success("Copied to clipboard")` / `error("Failed to copy")` instead.
- Keep the ESC-closes-menu `useKeyboardShortcuts` behavior untouched.

## Critical files
- **New:** `app/components/Toast/{ToastProvider,ToastViewport,ToastItem}.tsx`, `hooks.ts`, `types.ts`, `index.ts`, and a thin `"use client"` analytics bridge (e.g. `ToastAnalyticsProvider.tsx`) that lives in the app layer and supplies `onEvent`.
- **Edit:** `app/layout.tsx` (wire provider + analytics adapter), `app/globals.css` (tokens), `app/components/CsvViewer/CopyControl.tsx` (migrate to `useToast`)
- **Reference patterns:** `app/components/ThemeProvider/ThemeProvider.tsx` + `index.ts` (context/provider/hook + barrel), `CopyControl.tsx` (existing toast styling/timer to generalise), `lib/analytics.ts` (`track`, imported only at the wiring site)

## Tests (`__tests__/components/Toast/`)
- `hooks.test.ts` (`renderHook` + `act`, Jest fake timers):
  - `showToast`/`success`/`error` add a toast with correct variant/duration/id.
  - Auto-dismiss after 5s; per-toast `durationMs` override; `durationMs <= 0` stays sticky.
  - `dismissToast(id)` removes the right toast; multiple toasts stack independently.
  - **Visibility gating:** with `document.visibilityState` stubbed to `"hidden"`, `showToast` does not add to `toasts`; dispatching `visibilitychange` after setting `"visible"` flushes it.
  - **Decoupled events:** pass a `jest.fn()` as `onEvent`, assert it fires `{ type: "shown" }` on show and `{ type: "dismissed", reason }` on auto/manual dismiss — proving analytics is injected, not imported. (No `jest.mock("@/lib/analytics")` needed in the module tests.)
- `ToastItem.test.tsx` (`render` + `userEvent`):
  - Renders message + variant `role`; close button has `aria-label` and dismisses on click.
  - Pause-on-hover: with fake timers, hovering prevents dismissal until pointer leaves.
- `useToast` outside provider throws (guard).
- Follow existing setup conventions in `jest.setup.ts` (uuid is already mocked in `__mocks__/uuid.ts` — confirm whether to use `crypto.randomUUID()` or the mocked `uuid` package for deterministic ids; prefer the package the repo already mocks).

## Verification
1. `npm test` — all new + existing tests green; `npm test -- --coverage` as CI does.
2. `npx tsc --noEmit` (strict) and lint clean.
3. **Decoupling check:** `grep -r "@/lib/analytics" app/components/Toast/` returns nothing — the module folder has no app-specific imports.
4. Manual (`npm run dev`):
   - Upload a CSV, click **Copy** → success toast slides in bottom-right, auto-dismisses ~5s.
   - Hover the toast → countdown pauses; move away → it resumes and dismisses.
   - Click the toast's close button → dismisses immediately.
   - Force a copy failure (e.g. deny clipboard permission) → error toast with error styling.
   - Toggle light/dark theme → toast colors adapt (new tokens).
   - Trigger a copy, immediately switch to another browser tab; toast must **not** appear until you return to the tab, then it shows.
   - Trigger several copies quickly → toasts stack vertically without overlap.
   - Mixpanel receives "Toast Shown"/"Toast Dismissed" events (proves the injected adapter works end-to-end).
