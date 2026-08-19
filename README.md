# CSV Preview

**A privacy-first CSV viewer and editor that runs entirely in your browser.**

Live at **[csvpreview.com](https://csvpreview.com)**.

Open a `.csv` file and explore it instantly — sort, filter, edit and export — without uploading anything. Parsing happens on your device with [Papa Parse](https://www.papaparse.com/); there are no accounts, no servers touching your data, and your current sheet is kept locally in your browser so you can pick up where you left off.

## What the site offers

- **[The viewer](https://csvpreview.com)** — open a CSV from your computer, drag and drop one in, paste CSV straight from the clipboard, or start from a blank sheet. Toggle the first row as a header so it stays pinned while you scroll, sort any column, filter rows by value, search or numeric comparison, edit cells in place, delete rows, copy a selection, and download the result.
- **[Free tools](https://csvpreview.com/tools)** — in-browser converters that never upload a file: [CSV to Excel](https://csvpreview.com/tools/csv-to-excel) (merge one or many CSVs into a single `.xlsx`, or convert each separately) and [Excel to CSV](https://csvpreview.com/tools/excel-to-csv) (every worksheet becomes its own CSV, downloadable as a zip).
- **[Ready-made datasets](https://csvpreview.com/data)** — 40+ curated CSVs across nine categories (geography, transport, economics, history, food & drink, animals & nature, science, language & culture, architecture), each opening directly in the viewer.

### Example datasets

- [World Population by Country & Territory](https://csvpreview.com/data/geography/world-population) — 239 countries and territories with population, % of world share and census dates.
- [S&P 500 Companies](https://csvpreview.com/data/economics/sp500-companies) — 503 constituents with ticker, sector, sub-industry, headquarters and date added.
- [Periodic Table Elements](https://csvpreview.com/data/science/periodic-table-elements) — every element with atomic number, symbol, group, block, atomic mass and discovery details.
- [Busiest Airports](https://csvpreview.com/data/transport/busiest-airports) and [World Airports](https://csvpreview.com/data/transport/world-airports) — traffic rankings and IATA/ICAO airport codes.

## Tech stack

- **Next.js 16** (App Router) + **React 19**, TypeScript in `strict` mode
- **[Linaria](https://github.com/callstack/linaria)** zero-runtime CSS-in-JS, themed with CSS custom properties (light/dark)
- **Papa Parse** for CSV parsing, `read-excel-file` / `write-excel-file` for the Excel tools, `fflate` for zips
- **Jest** + React Testing Library
- Mixpanel and Vercel Analytics / Speed Insights for product analytics (never your file contents)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build   # production build
npm run lint    # eslint
npm test        # jest
npm run test:coverage
```

## Project layout

There is no `src/` directory — application code lives at the repo root:

```
app/            routes and UI (App Router)
├── page.tsx        the CSV viewer
├── data/           dataset browser: /data/[category]/[slug]
├── tools/          free converters
├── about/
└── components/     shared components, one folder each
lib/            non-UI logic: parsers, exporters, theme, analytics
└── datasets/       bundled datasets (data.csv + meta.ts per slug)
__tests__/      tests, mirroring the source paths
```

## Contributing

Read [`AGENTS.md`](./AGENTS.md) first — it holds the coding guidelines for this project (file structure, the behaviour/view split in components, styling tokens, testing) and applies to humans and coding agents alike. Run `npm test` before opening a PR.
