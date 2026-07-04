# CountPills

- Small badges shown above the grid reporting the CSV's **row** and **column** counts (like the CSV Preview Chrome extension).
- Purely presentational — no state, no `"use client"`, so it works in both the client editor and server-rendered dataset pages.

## Props (`CountPillsProps`)
- `rowCount` — visible (post-filter) rows; equals `totalRowCount` when unfiltered.
- `totalRowCount` — total (unfiltered) rows.
- `columnCount` — number of columns.
- `hasActiveFilter` — when `true`, row pill reads `"X of Y rows"`; otherwise `"Y rows"`.

## `hooks.ts` (pure, unit-tested)
- `computePillLabels(props)` → `{ rowsLabel, columnsLabel }`; handles pluralization + locale thousands separators.
- `computeCsvCounts(data, firstRowAsHeader)` → counts straight from parsed rows, for **static/unfiltered** contexts (dataset pages). Excludes the header row when `firstRowAsHeader`; column count is the true max row width (not the grid's display-padded width).

## Who feeds it
- **Editor:** `CsvViewer` derives counts via `computeGridCounts` from the grid's `exportState`.
- **Dataset pages:** `app/data/[slug]/page.tsx` uses `computeCsvCounts`.
