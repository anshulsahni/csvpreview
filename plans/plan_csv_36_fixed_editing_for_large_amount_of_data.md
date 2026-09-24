# CSV-36 — Leaving cell edit mode freezes the grid on large CSV files

## Context

[CSV-36](https://linear.app/csvpreview/issue/CSV-36/leaving-cell-edit-mode-freezes-the-grid-for-many-seconds-on-large-csv) (Bug, Backlog, related to CSV-28): double-clicking a cell and then clicking away freezes the page for ~40s on a 30,000 × 30 CSV — even when nothing was typed. Enter/Tab/Escape behave the same. A plain cell-to-cell click is fast; only the first click after edit mode is slow, and the freeze scales with row count, so the app becomes unusable for editing well before the file is genuinely large.

Root cause, confirmed against the current branch (`42d4e7e`, main + the CSV-11 download-as-JSON merge):

1. Leaving edit mode always commits, so `csvData` gets a new identity, so `computeViewModel` in `app/components/SpreadsheetGrid/hooks.ts:177` re-runs.
2. `computeViewModel` eagerly loops all `numCols` (min 26) columns calling `detectColumnType` + `getUniqueValues` over every row (`hooks.ts:260-266`). Only the **one** column with an open filter dropdown ever reads these — `SpreadsheetGrid.tsx:130-134` gates them behind `vm.openColIdx === ci`. Everything else is thrown away.
3. `getUniqueValues` (`lib/filterUtils.ts:24-26`) sorts with a per-comparison `localeCompare`, which dominates the cost.
4. Several layers deep-copy the whole sheet on every edit: `applyFiltersWithSourceIndices` clones every row even with zero active filters (`filterUtils.ts:70` and `:88`), `sortRowsWithSourceIndices` clones every row (`sortUtils.ts:102`), and `handleCellChange` rebuilds the array with `.map((row) => row.slice())` (`CsvViewer/hooks.ts:387-400`).

Measured locally, `Intl.Collator.compare` sorts 30k strings in **57ms** vs **2457ms** for `localeCompare` — 43× faster, byte-identical ordering.

Intended outcome: editing a cell and moving away is instant on a file of any size.

### State of the branch

Three feature commits landed since this was first analysed (CSV-31 scroll-maths split, the tools hub page, and CSV-11 download-as-JSON). Re-verified against `git diff 8ad560c..HEAD`: **`lib/filterUtils.ts`, `lib/sortUtils.ts`, `SpreadsheetGrid/hooks.ts`, `useSpreadsheetGridEditing.ts` and `SpreadsheetGrid.tsx` are all untouched** by those commits, so the diagnosis stands unchanged. Two things did move and are reflected below:

- `app/components/CsvViewer/hooks.ts` was reworked by CSV-11 (format registry, `exportJSON`, `downloadBlob`) — line numbers shifted and the local `triggerCsvDownload` is gone, but `handleCellChange` and the localStorage effect are untouched.
- `__tests__/components/CsvViewer/hooks.test.ts` now exists and already has a `handleCellChange()` describe block (line 893) — the new cases extend it rather than create the file.

CSV-11's new read path (`exportJSON` / `rowsToJsonRecords` in `lib/jsonExporter.ts`) only reads body rows, so it does not affect the de-cloning changes below.

## Changes

### 1. `lib/sortUtils.ts` — shared collator + stop cloning rows

- Add and export a module-level `export const textCollator = new Intl.Collator(undefined, { sensitivity: "base" });` — `sortUtils.ts` is the natural home since `filterUtils.ts` already imports from it (`filterUtils.ts:1`).
- Use it in the text branch of `compareValues` (`sortUtils.ts:75`) instead of `ta.localeCompare(tb, undefined, { sensitivity: "base" })`.
- In `sortRowsWithSourceIndices`, keep the row reference (`row` instead of `row.slice()`, `sortUtils.ts:102`).

### 2. `lib/filterUtils.ts` — collator + stop cloning rows

- Import `textCollator` and sort with `textCollator.compare` in `getUniqueValues` (`filterUtils.ts:24-26`). Ordering is unchanged, so the existing `__tests__/lib/filterUtils.test.ts` assertion stays green as-is.
- In `applyFiltersWithSourceIndices`, stop deep-copying: the no-active-filter early return becomes `rows.slice()` (fresh outer array, shared row references) instead of `rows.map((row) => row.slice())` (`:70`), and the filtered loop pushes `row` instead of `row.slice()` (`:88`).
- Verified safe: nothing mutates a body row in place. `handleCellChange` is the only writer and (after change 5) produces a new row; every other consumer — export, JSON conversion, clipboard, row delete, aggregates — reads only.

### 3. `app/components/SpreadsheetGrid/hooks.ts` — compute column metadata on demand

Replace the eager `for (let ci = 0; ci < numCols; ci += 1)` loop (`hooks.ts:260-266`) with lazily-populated caches: keep the two `Map`s, but fill them inside the `columnTypeFor` / `uniqueValuesFor` closures on first call for a given `colIdx`. The maps live in the `computeViewModel` closure, so they invalidate exactly when the view model does (data / header flag / sort / filters).

This turns the per-edit cost from O(rows × cols) with a locale sort into O(rows), and the only two callers (`SpreadsheetGrid.tsx:133-134`) ask solely for the open column. `detectColumnType` trims internally, so the redundant `bodyRows.map((row) => (row[ci] ?? "").trim())` pre-pass goes away.

The exported test seam `computeSpreadsheetGridViewModel` keeps its current signature and return type — laziness is invisible from outside.

### 4. `app/components/SpreadsheetGrid/useSpreadsheetGridEditing.ts` — don't commit unchanged values

- Add an `initialValueRef` alongside `draftValueRef` (`:49`), set in `startEditing` from `bodyRows[rowIdx]?.[colIdx] ?? ""` (`:69`) and cleared in `exitEditing` (`:86`).
- Route `commitAndMove` (`:97`), `commitAndStay` (`:106`) and `commitAndFocusCell` (`:112`) through a `commitIfChanged(rowIdx, colIdx, value)` helper that skips `commitAt` when `value === initialValueRef.current`. Opening a cell and clicking/tabbing away with no typing then costs nothing at all.

### 5. `app/components/CsvViewer/hooks.ts` — structural sharing in `handleCellChange`

Rewrite the updater (`hooks.ts:387-400`) to:
- return `prev` unchanged when the target row exists and already holds `value` (React bails out of the re-render entirely — a second safety net behind change 4, and it also keeps the `JSON.stringify` persist effect from firing);
- otherwise `slice()` only the outer array and the one touched row, leaving every other row shared.

The blank-state path (`prev === null`, or a `dataRowIndex` past the end) must keep padding with `[]` rows and `""` cells — `__tests__/components/CsvViewer/hooks.test.ts:894` asserts it.

## Out of scope (flag in the PR, file follow-ups)

- **Filter dropdown on high-cardinality columns.** Making unique values lazy moves their cost to dropdown-open. With the collator that compute is ~50-100ms, but `FilterDropdown.tsx:83` still renders one checkbox per unique value unvirtualized, so a 30k-distinct-value column will be slow to open. Pre-existing; worth its own ticket (cap the list, or reuse `useRowVirtualizer`).
- **Escape commits instead of discarding.** `commitAndStay` on Escape (`useSpreadsheetGridEditing.ts:167`) is non-standard spreadsheet behaviour. Change 4 makes Escape-without-typing free, which is what CSV-36 reports; making Escape actually revert is a behaviour change for a separate ticket.
- **localStorage persistence.** The effect at `CsvViewer/hooks.ts:275-282` runs `JSON.stringify` over the whole sheet on every `csvData` change (then almost certainly hits the quota and swallows the throw). Change 5 removes it from the no-op path but not from real edits.

## Tests

Extend the existing suites, mirroring current paths:

- `__tests__/lib/sortUtils.test.ts` — existing ordering assertions are the regression guard for the collator swap; add a row-identity assertion for `sortRowsWithSourceIndices` (`expect(result.rows[0]).toBe(rows[<its source index>])`).
- `__tests__/lib/filterUtils.test.ts` — the `getUniqueValues` ordering test must stay green untouched; add identity assertions that `applyFiltersWithSourceIndices` returns a new outer array whose row references are the originals, on both the no-filter and the filtered path.
- `__tests__/components/SpreadsheetGrid/hooks.test.ts` — `computeSpreadsheetGridViewModel(...).uniqueValuesFor(ci)` / `.columnTypeFor(ci)` still return the same values, including for a column index past the widest row (`[""]` / `"text"`) and when called twice (cache hit returns an equal result).
- `__tests__/components/SpreadsheetGrid/SpreadsheetGrid.test.tsx` — already exercises `onCellChange`; add a case that entering edit mode and clicking another cell without typing does **not** fire `onCellChange`, and that typing a new value still does.
- `__tests__/components/CsvViewer/hooks.test.ts` — add to the existing `handleCellChange()` describe (line 893): writing the current value leaves the `csvData` reference identical, and a real edit returns a new array and a new row while untouched rows keep their references.

## Verification

1. `npm test` — full suite green. The existing ordering assertions in `filterUtils.test.ts` / `sortUtils.test.ts` and the two `handleCellChange()` cases are the behavioural guards.
2. `npm run dev`, generate a 30,000 × 30 CSV, load it, then:
   - double-click a cell, click a different cell → no perceptible freeze (target: one frame's worth of work, vs ~40s today);
   - repeat with Enter, Tab, Escape;
   - actually type a new value and commit → the new value renders and survives a reload;
   - open a filter dropdown, apply a set filter and a numeric filter, clear them → unchanged behaviour;
   - sort a column asc/desc/none → unchanged ordering, including blanks-last and mixed numeric/text;
   - select rows and delete; download visible/all/selected as CSV **and** as JSON (the CSV-11 path reads the same row arrays we stopped cloning) → unchanged output.
3. Record before/after numbers from a Chrome DevTools performance trace of the click-away interaction for the PR description.
