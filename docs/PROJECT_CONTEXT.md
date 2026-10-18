# CSV Preview — Project Context

> **Audience:** people and non-coding AI assistants (for example, a Claude project on the web) who need to understand the codebase without reading it.
> **Not for coding agents.** Coding agents must use [`AGENTS.md`](../AGENTS.md) and the code itself. This file is excluded from them (see "About this file" at the end).
> **Snapshot:** written on 2026-10-11, from `main` at commit `125a8f0`. File paths are relative to the repo root.

---

## 1. What the product does

CSV Preview is a free, privacy-first CSV viewer and editor at [csvpreview.com](https://csvpreview.com). All parsing, sorting, filtering, and editing happen in the user's browser. User data is never sent to a server. There are no accounts.

The site has four parts:

1. **The viewer** (`/`). The user opens a CSV or JSON file (file picker, drag and drop, or paste), or starts with a blank sheet. The user can pin the first row as a header, sort, filter (by value, text, or number), select ranges (with sum, average, min, max), edit cells, delete selected rows, copy, and download the sheet or a range as CSV, JSON, TSV, pipe-separated, or space-separated text. There are keyboard shortcuts and light, dark, and system themes. The sheet is saved in the browser's `localStorage`, so it survives a reload.

2. **Free tools** (`/tools`). Converters that also run fully in the browser:
   - **CSV to Excel** (`/tools/csv-to-excel`): merges one or many CSV files into one `.xlsx` file, or makes one file each.
   - **Excel to CSV** (`/tools/excel-to-csv`): turns each worksheet into a CSV, with a zip download for all of them.

3. **Datasets** (`/data`). 43 curated CSV datasets in 9 categories (geography, transport, economics, history, food and drink, animals and nature, science, language and culture, architecture). Each dataset has its own page with a read-only grid and an "Open in editor" button. These pages are the main source of search traffic.

4. **About** (`/about`). The story behind the app.

See also [`README.md`](../README.md) and the v0.1 user stories and wireframes in [`specs/v0.1/`](../specs/v0.1/).

---

## 2. Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript in `strict` mode |
| Build | Turbopack |
| Styling | Linaria (zero-runtime CSS-in-JS, through `@wyw-in-js/nextjs`) with CSS custom properties for theme tokens |
| CSV parsing | PapaParse, behind a small wrapper in [`lib/csvParser.ts`](../lib/csvParser.ts) |
| Excel | `read-excel-file` (import) and `write-excel-file` (export) |
| Zip | `fflate` |
| Analytics | Mixpanel, Vercel Web Analytics, Vercel Speed Insights |
| Testing | Jest 30, React Testing Library, `jest-dom` |
| Lint | ESLint 9 with `eslint-config-next` |
| Hosting | Vercel (from the Vercel Analytics and Speed Insights packages) |
| CI | GitHub Actions on Node 24: tests with coverage, lint, and typecheck run as three parallel jobs ([`.github/workflows/test.yml`](../.github/workflows/test.yml)). CI does not run the production build. |

All dependency versions are pinned exactly in [`package.json`](../package.json). The `overrides` block forces safe versions of some transitive packages to fix security alerts.

The only environment variable is `NEXT_PUBLIC_MIXPANEL_TOKEN`. It is optional. Without it, Mixpanel turns itself off.

---

## 3. Folder map

There is no `src/` folder. Code lives at the repo root.

| Path | What it holds |
| --- | --- |
| [`app/`](../app/) | Routes and UI (App Router) |
| [`app/layout.tsx`](../app/layout.tsx) | Root layout: default SEO metadata, theme cookie, global providers, Vercel analytics |
| [`app/page.tsx`](../app/page.tsx) | Home page, which is the viewer |
| [`app/globals.css`](../app/globals.css) | All design tokens (colours and other CSS custom properties) for light and dark themes |
| [`app/sitemap.ts`](../app/sitemap.ts), [`app/robots.ts`](../app/robots.ts) | Generated `sitemap.xml` and `robots.txt` |
| [`app/data/`](../app/data/) | Dataset hub, category pages (`[category]/`), and dataset pages (`[category]/[slug]/`) |
| [`app/tools/`](../app/tools/) | Tools hub and one folder per tool, each with its own `components/` |
| [`app/about/`](../app/about/) | About page |
| [`app/components/`](../app/components/) | Shared components, one folder each. Main ones: `CsvViewer` (the viewer screen), `SpreadsheetGrid` (the grid), `UploadModal`, `DownloadModal`, `FilterDropdown`, `Toolbar`, `KeyboardShortcuts`, `Toast`, `ThemeProvider`, `DatasetJsonLd`, `Breadcrumb` |
| [`lib/`](../lib/) | Code with no React and no routes: parsers, exporters, sort and filter logic, format registries, analytics, brand constants, tool registry |
| [`lib/datasets/`](../lib/datasets/) | One folder per dataset (`data.csv` + `meta.ts`), plus the registry and the category list |
| [`__tests__/`](../__tests__/) | Tests. The folder layout mirrors the source layout. |
| [`public/`](../public/) | Static files: brand images, `llms.txt`, IndexNow key file |
| [`plans/`](../plans/), [`specs/`](../specs/), [`TASKS.md`](../TASKS.md), [`tasks.csv`](../tasks.csv) | Planning notes and the original build plan (see "Known limits") |
| [`.claude/`](../.claude/), [`.cursor/`](../.cursor/) | Coding-agent config: a PR-writer agent, skills for Linear tickets and PR descriptions, Cursor rules |

**Component pattern.** In each component folder, `<Name>.tsx` only renders, `hooks.ts` holds state, effects, and pure helpers for tests, and `index.ts` re-exports the public parts. Large components split behaviour into several hook files (see [`app/components/SpreadsheetGrid/`](../app/components/SpreadsheetGrid/)).

---

## 4. How dataset pages are generated

All dataset pages are static HTML. Next.js builds them once, at build time.

**Data sources.** Each dataset has a folder `lib/datasets/<slug>/` with two files:
- `data.csv`: the data.
- `meta.ts`: the title, description, keywords, a "first row is header" flag, the date the CSV last changed (`lastModified`), and an optional licence override. The shape is defined in [`lib/datasets/types.ts`](../lib/datasets/types.ts).

**Registration.** Import the `meta.ts` into [`lib/datasets/index.ts`](../lib/datasets/index.ts), and add the slug to one category in [`lib/datasets/categories.ts`](../lib/datasets/categories.ts). A test ([`__tests__/lib/datasets/categories.test.ts`](../__tests__/lib/datasets/categories.test.ts)) fails if a dataset has no category, a category lists an unknown dataset, or a category slug equals a dataset slug.

**URL shape.** Each page lives at `/data/{category}/{slug}`, for example `/data/geography/world-population`. The category list feeds the static paths, the sitemap, the breadcrumbs, the "related datasets" lists, and the 301 redirects from the old flat URLs `/data/{slug}` (set up in [`next.config.ts`](../next.config.ts)).

**Build steps for one dataset page** ([`app/data/[category]/[slug]/page.tsx`](../app/data/[category]/[slug]/page.tsx)):
1. Next.js builds every `{category, slug}` pair. Other URLs return 404 (`dynamicParams` is `false`).
2. The page returns 404 if the slug is not in that category. This stops one dataset from appearing under many URLs.
3. The server reads `data.csv` from disk ([`lib/datasets/loadCsv.ts`](../lib/datasets/loadCsv.ts)), parses it, and counts rows and columns.
4. The page renders the Dataset JSON-LD, the breadcrumb, the title, the counts, a read-only grid, and an "Open in editor" button.
5. "Open in editor" ([`OpenInEditorButton.tsx`](../app/data/[category]/[slug]/OpenInEditorButton.tsx)) writes the rows into `localStorage` and then goes to `/`. The viewer loads the data from there. No network request is made.

The category pages ([`app/data/[category]/page.tsx`](../app/data/[category]/page.tsx)) and the hub page ([`app/data/page.tsx`](../app/data/page.tsx)) are also static. Their content comes from the same category list.

---

## 5. SEO setup

### Metadata
Each `page.tsx` exports its own `metadata` (or `generateMetadata` for dynamic pages): title, description, keywords, `robots: index, follow`, a canonical URL, and Open Graph and Twitter cards.

The site-wide defaults and `metadataBase` are in [`app/layout.tsx`](../app/layout.tsx). The canonical domain and the brand image paths are in [`lib/brand.ts`](../lib/brand.ts). All pages use the same 1024×1024 logo as the social preview image.

### JSON-LD (schema.org structured data)

| Page | Types | Source |
| --- | --- | --- |
| Dataset pages | `Dataset` (name, description, URL, `dateModified`, free-access flag, licence, creator and publisher, keywords, column names as `variableMeasured`) | [`app/components/DatasetJsonLd/jsonLdUtils.ts`](../app/components/DatasetJsonLd/jsonLdUtils.ts) |
| Every page with a breadcrumb (data hub, categories, datasets, tools) | `BreadcrumbList` | [`app/components/Breadcrumb/hooks.ts`](../app/components/Breadcrumb/hooks.ts) |
| Tools hub | `CollectionPage` + `ItemList` of `SoftwareApplication` entries | [`app/tools/components/toolsJsonLd.ts`](../app/tools/components/toolsJsonLd.ts) |
| Each tool page | `WebApplication` + `FAQPage` (built from that page's FAQ items) | the tool's `page.tsx`, for example [`app/tools/csv-to-excel/page.tsx`](../app/tools/csv-to-excel/page.tsx) |

Notes on the Dataset markup:
- The licence is CC BY 4.0 for the curated compilation ([`lib/brand.ts`](../lib/brand.ts)). A dataset can override it in its `meta.ts`.
- The markup has no `distribution` or download URL on purpose. The app has no route that serves the raw CSV file.

The home page, the about page, and the category pages have no JSON-LD of their own. The category pages have only the breadcrumb.

### Sitemap and crawl files
- [`app/sitemap.ts`](../app/sitemap.ts) lists the static pages, each tool (from [`lib/tools.ts`](../lib/tools.ts)), the data hub, each category, and each dataset. A dataset's `lastModified` becomes its sitemap date. Each category page and the data hub use the newest date of the datasets they contain.
- [`app/robots.ts`](../app/robots.ts) allows all crawlers and points to the sitemap.
- [`public/llms.txt`](../public/llms.txt) is a short site summary for AI tools. It lists the main pages and every dataset. **It is maintained by hand.**
- An IndexNow key file is in `public/`. IndexNow lets the site tell search engines when pages change.

---

## 6. Key decisions and why

1. **Everything runs on the client.** Privacy is the main selling point. Files are parsed and changed only in the browser. The server only builds and serves static pages.

2. **`localStorage` for persistence.** It keeps the sheet after a reload with no accounts or servers. "Open in editor" also uses it to pass a dataset to the viewer.

3. **Static dataset pages from files in the repo.** Pages are fast, cheap to host, and easy for search engines to crawl. To add or change a dataset, you change files in the repo and deploy again.

4. **Dataset URLs nested under categories** (commit `e663154`). A clear hierarchy helps search engines understand the site. The old flat URLs return a permanent (301) redirect. Each redirect source is a fixed path, not a pattern. A pattern like `/data/:slug` would also match `/data/{category}` and cause a redirect loop.

5. **Registries as the single source of truth.** Tools ([`lib/tools.ts`](../lib/tools.ts)), datasets and categories ([`lib/datasets/`](../lib/datasets/)), upload formats ([`lib/uploadFormats.ts`](../lib/uploadFormats.ts)), and download formats ([`lib/downloadFormats.ts`](../lib/downloadFormats.ts)) each live in one list. The pages, the sitemap, the menus, and the file pickers all read from these lists. So adding an item is usually a change to one file.

6. **Linaria for styling.** CSS is extracted at build time, so there is no styling cost at runtime. Theme colours are CSS variables, so light and dark mode need no JavaScript. The theme choice is saved in a cookie and read on the server. This prevents a flash of the wrong theme on page load.

7. **View and behaviour are separate.** Logic in hooks and pure helpers is easy to unit test. CI runs the Jest suite on every push.

8. **Performance for large files.**
   - The grid renders only the rows in view (row virtualisation, commit `eb5bb6d`).
   - A fix for a freeze after cell editing (CSV-36, [`plans/plan_csv_36_fixed_editing_for_large_amount_of_data.md`](../plans/plan_csv_36_fixed_editing_for_large_amount_of_data.md)) does three things:
     - It stops deep copies of the whole sheet.
     - It computes filter values only for the column whose filter is open.
     - It uses `Intl.Collator` for text sorting. This sort was measured as about 43 times faster than `localeCompare`.

9. **One place for analytics.** All Mixpanel calls go through [`lib/analytics.ts`](../lib/analytics.ts). [`app/components/AnalyticsProvider.tsx`](../app/components/AnalyticsProvider.tsx) tracks page views, and one document-level listener tracks every button and link click by its visible text. Custom events record actions and counts (for example, format and row count), not cell data.

10. **File type comes from the extension first.** Browsers often report wrong or empty MIME types, so the MIME type is only a fallback ([`lib/uploadFormats.ts`](../lib/uploadFormats.ts)).

11. **Small, separate modules.** Modules like the tool registry have no dependencies on the rest of the app. The goal is that they can become open-source packages later.

12. **No "open the result in the viewer" button on the converter tools.** This is a product decision. Each converter returns its file and nothing more.

13. **Strict dependency control.** Versions are pinned exactly, security alerts are fixed with `overrides`, and only named packages may run install scripts.

---

## 7. Known limits

- **Storage size.** Browsers usually give `localStorage` about 5 MB per site. The whole sheet is saved as one JSON string. A large sheet may fail to save, and the app ignores the error. The sheet still works, but it is lost on reload.
- **Memory and main thread.** The whole file is held in memory and parsed on the main thread (no Web Worker). Very large files can make the page slow, even with virtualisation.
- **Viewer formats.** The viewer opens only CSV and JSON. Excel files must go through the Excel to CSV tool first. The viewer shows one sheet at a time.
- **Converter limits.** Excel to CSV accepts up to 10 files, 20 MB per file, 50 MB in total. CSV to Excel sets no explicit limits.
- **No offline support.** The README says "Works offline", but the app has no service worker and no web app manifest. It works without a network only while the page stays open.
- **No raw CSV download for datasets.** A user must open the dataset in the editor and download it from there. For the same reason, the JSON-LD has no `distribution` field.
- **Dataset changes need a deploy.** All data is in the repo and the pages are built at build time.
- **Values kept by hand can drift:** the dataset list in [`public/llms.txt`](../public/llms.txt), the full URLs hard-coded in the two tool pages (instead of `SITE_URL`), and each dataset's `lastModified` date.
- **Planning docs are out of date.** [`TASKS.md`](../TASKS.md) and [`tasks.csv`](../tasks.csv) show cell editing, download, toolbar, and persistence as "To Do", but these features are live. Current work is tracked in Linear (team "Csvpreview").
- **Agent guide drift.** [`AGENTS.md`](../AGENTS.md) says no `app/robots.ts` exists, but it was added in commit `f092d1c`.
- **Style rule exceptions.** The dataset page uses inline styles instead of Linaria. The tool pages use the about page's navbar, not the shared one.
- **CI does not run `next build`.** A build error can reach `main` if the developer does not run the build on their own machine first.

---

## 8. Open questions

1. **Offline.** Add a service worker and a manifest so "Works offline" is fully true?
2. **Large files.** Move parsing to a Web Worker and storage to IndexedDB (much more space than `localStorage`)? What file size must the app support?
3. **Excel in the viewer.** Open `.xlsx` directly, or keep Excel only in the tools?
4. **Dataset downloads.** Add a static raw-CSV URL per dataset? It would allow a `distribution` field in the JSON-LD, which can help in Google Dataset Search.
5. **More structured data.** Add JSON-LD to the home, data hub, and category pages?
6. **`llms.txt`.** Generate it from the registries, like the sitemap?
7. **Dataset sources.** How are sources and dates checked? Show the source on each page?
8. **Next tools.** What comes after CSV↔Excel (for example, JSON↔CSV, or merge and split CSV)?
9. **Old planning files.** Archive `TASKS.md`, `tasks.csv`, and `plans/` now that work is in Linear?
10. **CI build.** Add `npm run build` to CI?

---

## About this file

- **Purpose.** This file passes current project context to non-coding assistants, such as a Claude project on claude.ai. To use it, upload or paste it into that project.
- **Excluded from coding agents.** A deny rule in [`.claude/settings.json`](../.claude/settings.json) blocks Claude Code from reading it. [`.cursorignore`](../.cursorignore) hides it from Cursor. [`AGENTS.md`](../AGENTS.md) tells all other agents to ignore it.
- **Updating.** This file is a snapshot. Rewrite it after large changes and update the "Snapshot" line.
