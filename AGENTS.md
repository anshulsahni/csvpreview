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

## Commands

Run every command from the repo root.

| Task | Command |
| --- | --- |
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Serve the build | `npm start` |
| All tests | `npm test` |
| All tests + coverage (CI runs this) | `npm test -- --coverage` |
| Tests in watch mode | `npm run test:watch` |
| One test file | `npm test -- __tests__/lib/sortUtils.test.ts` |
| One test by name | `npm test -- __tests__/lib/sortUtils.test.ts -t "sorts numbers"` |
| Tests by path pattern | `npm test -- --testPathPatterns "SpreadsheetGrid"` |
| Lint | `npm run lint` |
| Lint and auto-fix | `npm run lint -- --fix` |
| Typecheck | `npm run typecheck` |

Notes:

- CI runs tests, lint, and typecheck as three parallel jobs (`.github/workflows/test.yml`, Node 24). CI does not run `npm run build` — check the build yourself before you open a PR.
- Lint passes today with 5 warnings and 0 errors. Do not add new warnings.
- Jest 30 uses `--testPathPatterns` (plural). A plain file path also works and is simpler.
- Jest config is `jest.config.ts`. Setup is `jest.setup.ts`. Mocks are in `__mocks__/`.
- The only env var is `NEXT_PUBLIC_MIXPANEL_TOKEN`, and it is optional. Analytics turns itself off when the token is missing. Tests and builds need no `.env`.

## Where code lives

```
app/                       # routes + UI (App Router)
├── layout.tsx             # root layout: default metadata, theme cookie, providers
├── page.tsx               # "/" — the CSV viewer
├── globals.css            # ALL design tokens (CSS custom properties)
├── sitemap.ts             # sitemap for every route
├── about/                 # "/about"
├── data/                  # "/data" hub
│   └── [category]/        # "/data/{category}" + [slug]/ dataset detail page
├── tools/                 # "/tools" hub
│   ├── csv-to-excel/      # page.tsx + components/
│   └── excel-to-csv/      # page.tsx + components/
└── components/            # shared components, one folder each (see 1.2)
    ├── Navbar.tsx         # exception: flat file, no folder
    ├── AnalyticsProvider.tsx   # fires page views
    ├── SpreadsheetGrid/   # the grid: hooks split per concern + pure *Utils.ts
    ├── CsvViewer/  Toolbar/  FilterDropdown/  UploadModal/  DownloadModal/
    ├── ThemeProvider/  ThemeToggle/  Toast/  ToastAnalyticsProvider/
    └── KeyboardShortcuts/ # provider + keys.ts (Keys enum) + utils.ts

lib/                       # no React, no routes
├── brand.ts               # SITE_URL, brand image paths, OG defaults
├── theme.ts               # Theme enum, THEME_COOKIE_KEY
├── analytics.ts           # Mixpanel: track, trackPageView, trackButtonClick, ...
├── tools.ts               # registry of /tools entries (hub cards, sitemap)
├── csvParser.ts  csvExporter.ts  sortUtils.ts  filterUtils.ts  clipboardUtils.ts
├── xlsxImporter.ts  xlsxExporter.ts  zipFiles.ts  downloadFile.ts
└── datasets/
    ├── index.ts           # dataset registry — import each meta here
    ├── categories.ts      # category list + path/redirect/static-param helpers
    ├── types.ts  loadCsv.ts
    └── <slug>/            # data.csv + meta.ts (one folder per dataset)

__tests__/                 # mirrors the source path
__mocks__/                 # jest module mocks
public/                    # static assets, brand/, llms.txt
```

### Task → path

| Task | Where |
| --- | --- |
| Add a route/page | `app/<route>/page.tsx` (Server Component + `metadata`) |
| Add a page-only component | `app/<route>/components/` |
| Add a shared component | `app/components/<Name>/` (`<Name>.tsx`, `hooks.ts`, `index.ts`) |
| Add a pure util | `lib/<name>.ts` |
| Add a dataset | `lib/datasets/<slug>/data.csv` + `meta.ts`, then register in `lib/datasets/index.ts` **and** add the slug to a category in `lib/datasets/categories.ts` |
| Add a dataset category | `lib/datasets/categories.ts` |
| Add a tool page | `lib/tools.ts` (registry) + `app/tools/<slug>/page.tsx` + `components/` |
| Change colours / add a token | `app/globals.css` (tokens), `lib/theme.ts` (theme enum + cookie) |
| Change per-section styling | `app/data/data-theme.css`, `app/tools/tools-theme.css`, `app/about/about.css` |
| Add or rename an analytics event | `lib/analytics.ts` (single choke-point — never call `mixpanel` directly) |
| Change page-view tracking | `app/components/AnalyticsProvider.tsx` |
| Change site-wide SEO / icons / OG | `app/layout.tsx` metadata + `lib/brand.ts` |
| Change per-page SEO | that route's `metadata` or `generateMetadata` in `page.tsx` |
| Change the sitemap | `app/sitemap.ts` |
| Change robots rules | No `app/robots.ts` exists. Indexing is set per page with `metadata.robots`. Add `app/robots.ts` if you need site-wide rules. |
| Change JSON-LD | `app/components/DatasetJsonLd/jsonLdUtils.ts` (datasets), `app/tools/components/toolsJsonLd.ts` (tools) |
| Change a keyboard shortcut | `app/components/KeyboardShortcuts/` (`keys.ts` holds the `Keys` enum) |
| Add a URL redirect | `next.config.ts` → `getLegacyDatasetRedirects()` in `lib/datasets/categories.ts` |
| Add a test | `__tests__/` at the mirrored path (`lib/x.ts` → `__tests__/lib/x.test.ts`) |
| Add a static asset | `public/` (brand images in `public/brand/`) |

Non-obvious points:

- `app/components/Navbar.tsx` is a flat file, not a folder. It is the one exception.
- Big components split behaviour across several hook files. See `app/components/SpreadsheetGrid/`. Follow that pattern instead of one huge `hooks.ts`.
- `next.config.ts` loads through Next's require hook. Any file it imports must use relative imports only, never `@/`.
- `lib/tools.ts` and `lib/datasets/categories.ts` feed the sitemap. A new tool or dataset appears in the sitemap only after you register it there.

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
- Dynamic routes follow the App Router convention, e.g. `app/data/[category]/[slug]/page.tsx`.

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

## Workflow conventions (Linear tickets & PR descriptions)

Two house conventions live as Claude Code skills under `.claude/skills/`. Agents that don't auto-load skills should read the relevant `SKILL.md` directly before doing that work:

- `.claude/skills/linear-ticket/SKILL.md` — team, style, and label rules for filing a Linear ticket.
- `.claude/skills/pr-description/SKILL.md` — how to write a PR description for this project.

## Change is permanent
This document is a living reference — it will evolve as our practices improve and new standards emerge. Refer back to it frequently while writing code, and use it as the objective standard during code reviews. The Cursor rule under `.cursor/rules/` is a contextual companion to these guidelines; when you change one, check whether the other needs updating too.
