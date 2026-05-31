<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

# Coding Guidelines

Welcome to the coding guidelines for **CSV Preview**. Treat these guidelines as your bible while writing code for this project. They apply to every contributor — humans and coding agents alike (Claude Code, Cursor, Copilot, Codex, and any other agent reading this file).

Do not violate these guidelines without reason. If you feel a specific guideline doesn't make sense, propose the change/addition/deletion to @anshulsahni. While your proposal is under review, continue following the guideline.

Violation of these guidelines is allowed only in two conditions:
  - There is an urgent hotfix required to solve a bug or a time-sensitive feature needs to be deployed. In this case, the violation should be fixed within a reasonable amount of time.
  - Following a guideline is preventing you from implementing a required feature.

## Project at a glance

CSV Preview is a **privacy-first, browser-based CSV viewer & editor** — all parsing, sorting, filtering, and editing happens client-side, no server round-trips for user data. It is an inherently **interactive** application, so client components are expected and normal here.

- **Framework:** Next.js 16 (App Router) + React 19, TypeScript (`strict`).
- **Styling:** [Linaria](https://github.com/callstack/linaria) (`@linaria/react`) zero-runtime CSS-in-JS, with CSS custom properties for theme tokens.
- **CSV parsing:** `papaparse`.
- **Analytics:** Mixpanel + Vercel Analytics/Speed Insights.
- **Testing:** Jest + React Testing Library + `@testing-library/jest-dom`.
- **Path alias:** `@/*` maps to the repo root (e.g. `@/app/components/Navbar`, `@/lib/brand`).

> There is **no `src/` directory** in this project. Application code lives at the repo root under `app/` (routes & UI) and `lib/` (non-UI logic, data, services).

Let's dive into the guidelines.

## Guidelines

### 1.1 File/Folder Structure
_Purpose:_ A standard file/folder structure improves discovery of modules while debugging an issue or building a feature.

- All pages must be built using the Next.js **App Router**, following the official routing conventions (read the local docs in `node_modules/next/dist/docs/`).
- A `page.tsx` file should contain only Next.js-specific code, such as:
  - The `metadata` object (and `generateMetadata`/`generateStaticParams` where needed).
  - The root component to be rendered.
  - Minimal component imports to keep the file focused.
- For pages that mix server and client components:
  - Keep `page.tsx` as a **Server Component** by default; only the leaf components that need interactivity carry `"use client"`.
  - Wrap client components in `<Suspense>` boundaries when they read search params or stream.
- **Page-specific** components are co-located with their route in a `components` folder inside the route directory.
- **Shared/reusable** components live under `app/components/<Name>/` (one folder per component — see 1.2).
- A typical route looks like:
  ```
  app
  └── about
      ├── components
      │   └── AboutContent.tsx
      └── page.tsx
  ```
- Dynamic routes follow the App Router convention, e.g. `app/data/[slug]/page.tsx`.

### 1.2 Building components
Separate **behavior** from the **view**. This convention is also enforced via the Cursor rule in `.cursor/rules/react-component-structure.mdc` — keep the two in sync.

Each UI unit lives in `app/components/<Name>/` (folder name = main component name, or a logical parent grouping its subcomponents) with these standard files:

- **`<Name>.tsx` — rendering only.** Consume a view-model from the local `hooks.ts` and wire props/handlers to JSX. Avoid business rules and side effects here (trivial DOM wiring is fine).
- **`hooks.ts` — all behavior.** State, effects, derived data, event handlers, and **pure** `computeXxxViewModel` helpers exported for unit tests.
- **`index.ts` — the public surface.** Re-export the default component and its public types:
  ```ts
  export { default } from "./Toolbar";
  export type { ToolbarProps } from "./Toolbar";
  ```
- **Additional pure helpers** that don't belong in `hooks.ts` are co-located as their own files (e.g. `selectionUtils.ts`). Large components may split hooks into focused files (e.g. `useSpreadsheetGridSelection.ts`, `useSpreadsheetGridEditing.ts`) and subcomponents (e.g. `CellEditor.tsx`, `SortArrows.tsx`).

Example component structure:
```
app/components/SpreadsheetGrid
├── SpreadsheetGrid.tsx          # render only
├── CellEditor.tsx               # subcomponent
├── SortArrows.tsx               # subcomponent
├── hooks.ts                     # behavior + compute* helpers
├── useSpreadsheetGridSelection.ts
├── useSpreadsheetGridEditing.ts
├── selectionUtils.ts            # pure helpers
└── index.ts                     # barrel
```

- **Do not** add a repo-root `hooks/` bucket — colocate hooks with the component that owns them.
- Keep state and effects as local to the owning component as possible; lift state only when it's genuinely shared.

### 1.3 Styling & design tokens
- Style components with **Linaria** (`styled` from `@linaria/react`, or the `css` tag) — keep styled definitions in the same `<Name>.tsx` file as the component they style.
- **Never hard-code theme-dependent values.** Use the CSS custom properties (e.g. `var(--foreground)`, `var(--background)`, `var(--primary)`) so light/dark theming works. The token source of truth is `lib/theme.ts` together with `app/globals.css`; theming is wired through `app/components/ThemeProvider`.
- When you need a new design token, add it to the theme/`globals.css` rather than introducing a one-off literal color in a component.
- There is no separate `design-system/` folder: CSS custom properties are our shared design language. A component qualifying for reuse goes in `app/components/` (see 1.2) — reusability alone does not justify a new token.

### 1.4 Non-UI code (`lib/`)
Anything that isn't a route or a React component lives under `lib/`, organized by nature:
- **Pure logic / utilities** — e.g. `lib/csvParser.ts`, `lib/filterUtils.ts`, `lib/sortUtils.ts`. Keep these framework-agnostic and easily unit-testable.
- **Services** — small focused integrations used across the app, e.g. `lib/analytics.ts` (Mixpanel). These are the "mini frameworks" of the app.
- **Data** — bundled datasets under `lib/datasets/<slug>/` (`data.csv` + `meta.ts`), registered through `lib/datasets/index.ts`. Add new datasets by following the existing slug-folder pattern and wiring them into the index.
- **Shared constants/config** — e.g. `lib/brand.ts`, `lib/theme.ts`.

### 1.5 Testing
This project ships with a real test suite — keep it green and grow it with the code.

- Tests live under `__tests__/`, mirroring the source path (e.g. `__tests__/components/SpreadsheetGrid/hooks.test.ts`, `__tests__/lib/csvParser.test.ts`).
- **Prefer unit tests** for pure functions: the `compute*` helpers in `hooks.ts`, and `lib/` utilities. Test hook behavior with `renderHook`.
- Add **RTL component tests** (`@testing-library/react`) only when the render branch is non-trivial — conditional attributes, keyboard routing, accessibility wiring.
- Run `npm test` locally before opening a PR; CI runs `npm test -- --coverage` on every push/PR.

### 1.6 Recommended practices
- **Links:** render all navigation with [`next/link`](https://nextjs.org/docs), regardless of CTA design. Links matter for SEO and accessibility; navigation must go through `href`, even when an `onClick` is also attached for analytics.
- **Buttons:** for interactive elements that trigger actions (not navigation), use semantic `<button>` elements — never click handlers on `<div>`, `<p>`, or `<span>`.
- **Semantic HTML:** use `<header>`, `<nav>`, `<main>`, `<section>`, etc. where appropriate. They don't change layout but improve SEO and accessibility by giving the document clear structure.
- **`"use client"` boundaries:** add `"use client"` to the smallest leaf that needs it; don't mark a whole page client just because one child is interactive.
- **TypeScript:** the project is `strict`. Type component props and hook return shapes explicitly; avoid `any`.
- **Imports:** use the `@/*` alias for cross-directory imports (`@/app/...`, `@/lib/...`) rather than long relative chains.

## Change is permanent
This document is a living reference — it will evolve as our practices improve and new standards emerge. Refer back to it frequently while writing code, and use it as the objective standard during code reviews. The Cursor rule under `.cursor/rules/` is a contextual companion to these guidelines; when you change one, check whether the other needs updating too.
