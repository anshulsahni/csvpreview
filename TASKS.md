# TASKS.md — csvpreview v0.1 Development Plan

## Module Build Order

1. Core Spreadsheet Grid  ← foundation; everything else mounts here
2. CSV Upload & Parsing   ← produces data; parser is parallel to grid
3. Header Row & Sorting   ← needs grid
4. Column Filters         ← needs header row
5. Cell Selection         ← needs grid
6. Aggregations Bar       ← needs cell selection
7. Cell Editing           ← needs grid + cell selection
8. Row & Column Mgmt      ← needs grid
9. Download Modal         ← needs cell selection + parser
10. Toolbar & Persistence ← wires everything together

---

## Module 1 — Core Spreadsheet Grid

**Goal:** Replace the current basic table in CsvViewer with a spreadsheet-style grid: row-number gutter, column-letter headers (A, B, C…), scrollable body, frozen top-left corner cell, empty-state hint at the bottom.

### Task 1.1 — Base Grid Component
- **What to build:** `SpreadsheetGrid` component that renders a scrollable table with a fixed row-number column on the left and column-letter headers (A, B, C…) across the top. Empty cells by default. Frozen corner cell where row/col headers intersect. Status bar at the bottom with hint text.
- **Files involved:**
  - `app/components/SpreadsheetGrid.tsx` (new — main grid)
  - `app/components/CsvViewer.tsx` (refactor to use SpreadsheetGrid)
  - `app/globals.css` (grid CSS variables if needed)
- **Dependencies:** None
- **Parallelizable:** Yes — can run in parallel with Task 2.1

---

## Module 2 — CSV Upload & Parsing

**Goal:** Full CSV ingestion: file dialog, drag-and-drop, paste, delimiter support, error reporting with line numbers.

### Task 2.1 — CSV Parser Library
- **What to build:** Pure TypeScript parser in `lib/csvParser.ts`. Must handle: configurable delimiter (comma, pipe, space), RFC 4180 quoted fields, escaped quotes, blank lines, and return structured `{ rows: string[][], errors: { line: number; message: string }[] }`.
- **Files involved:**
  - `lib/csvParser.ts` (new)
- **Dependencies:** None
- **Parallelizable:** Yes — runs in parallel with Task 1.1

### Task 2.2 — Upload Modal UI
- **What to build:** Modal overlay triggered by drag-over or clicking anywhere on the empty grid. Contains: drag-and-drop zone (accepts .csv only), native file input button, paste textarea (Ctrl+V), and a parse-error list showing exact line numbers. Matches wireframe 1A.
- **Files involved:**
  - `app/components/UploadModal.tsx` (new)
  - `app/components/CsvViewer.tsx` (wire modal open/close)
- **Dependencies:** Task 2.1 (parser), Task 1.1 (grid must exist to detect drag-over)
- **Parallelizable:** No — depends on 2.1 and 1.1

---

## Module 3 — Header Row & Sorting

**Goal:** Toggle first row as a frozen sticky header; sort columns ascending/descending with auto-detected numeric vs text comparison.

### Task 3.1 — Frozen Header Row Toggle
- **What to build:** "First row as header" checkbox/button in toolbar. When active: row 1 renders as `<thead>` with `position: sticky; top: 0`, receives column-letter labels replaced by actual header text, and is excluded from data rows. Teal highlight per wireframe 4.
- **Files involved:**
  - `app/components/SpreadsheetGrid.tsx` (thead/tbody split, sticky CSS)
  - `app/components/Toolbar.tsx` (toggle button — can stub if Toolbar not built yet)
- **Dependencies:** Task 1.1
- **Parallelizable:** No — depends on 1.1

### Task 3.2 — Column Sort (Done — 2026-04-19)
- **What to build:** Sort controls (▲ asc / ▼ desc) on each column-letter header. Click sets sort on that column/direction; click the same active arrow again clears. Auto-detects numeric vs text. Shows "N rows · Sorted by col X asc|desc" in status bar. Active sort column highlighted blue per wireframe 2.
- **Files involved:**
  - `app/components/SpreadsheetGrid/` (sort state in `hooks.ts`, UI in `SpreadsheetGrid.tsx`)
  - `lib/sortUtils.ts` (numeric detection + comparators + stable `sortRows`)
- **Dependencies:** Task 3.1
- **Parallelizable:** Yes — can run in parallel with Task 4.1

---

## Module 4 — Column Filters

**Goal:** Per-column filter dropdown: checkbox list for categorical values (searchable when ≥5 options), numeric comparison operators for numeric columns. Active filter shown in status bar.

### Task 4.1 — Filter Dropdown
- **What to build:** Filter icon (funnel) in each column header. Click opens a dropdown with: checkbox list of unique values (search input when ≥5 items), or operator + value input for numeric columns. "Apply Filter" and "Clear" buttons. Active filters highlighted. Status bar shows "Showing N of M rows · Filter active on col X". Matches wireframe 4.
- **Files involved:**
  - `app/components/FilterDropdown.tsx` (new — dropdown component)
  - `app/components/SpreadsheetGrid.tsx` (filter state, filtered-row slice passed to render)
- **Dependencies:** Task 3.1
- **Parallelizable:** Yes — can run in parallel with Task 3.2

---

## Module 5 — Cell Selection

**Goal:** Click a cell to select it; click-drag to select a range; click a column header to select the whole column; click a row number to select the whole row. Selected cells highlighted blue.

### Task 5.1 — Range Selection
- **What to build:** Mouse-down on a cell sets anchor; mouse-move extends selection rectangle; mouse-up finalizes. Click on column-letter header selects all rows in that column. Click on row-number gutter selects all columns in that row. Selection state stored as `{ anchorRow, anchorCol, activeRow, activeCol }`. Selected cells get highlight CSS class.
- **Files involved:**
  - `app/components/SpreadsheetGrid.tsx` (selection state + event handlers)
- **Dependencies:** Task 1.1
- **Parallelizable:** Yes — can run alongside Tasks 3.1, 8.1, 8.2

---

## Module 6 — Aggregations Bar

**Goal:** When 2+ numeric cells are selected, show Sum, Avg, Min, Max in the status bar (bottom of grid).

### Task 6.1 — Aggregations Status Bar
- **What to build:** Read selected cell range, extract numeric values (skip non-numeric), compute sum/avg/min/max, display in status bar: "N cells selected · Sum: X · Avg: Y · Min: Z · Max: W". Matches wireframe 5 (top-right detail). Hide when no numeric cells selected.
- **Files involved:**
  - `app/components/AggregationBar.tsx` (new — or inline into SpreadsheetGrid status bar)
  - `app/components/SpreadsheetGrid.tsx` (pass selection to AggregationBar)
- **Dependencies:** Task 5.1
- **Parallelizable:** No — depends on 5.1

---

## Module 7 — Cell Editing

**Goal:** Double-click or Enter key enters edit mode on a cell. Shift+Enter inserts newline. Escape cancels. Tab moves right, Enter moves down. Auto-grow cell height for multiline content.

### Task 7.1 — Inline Cell Editor
- **What to build:** On double-click or Enter: render a `<textarea>` inside the cell (no border flash), pre-filled with current value. Shift+Enter → newline in value. Enter → commit + move down. Tab → commit + move right. Escape → discard changes. Cell auto-sizes height to content. Matches all modes in wireframe 7.
- **Files involved:**
  - `app/components/SpreadsheetGrid.tsx` (editing state + keyboard handlers)
- **Dependencies:** Task 1.1, Task 5.1 (needs focused-cell concept)
- **Parallelizable:** No — depends on 5.1

---

## Module 8 — Row & Column Management

**Goal:** Hover over a row number shows +/delete buttons. Hover over a column header shows +/delete buttons. Insert/delete row or column at that position.

### Task 8.1 — Add/Delete Rows
- **What to build:** On hover of row-number gutter cell: show a "+" button (insert row above) and a "×" button (delete row). Buttons are absolutely positioned overlays, visible only on hover. Updates grid data array in place. Matches wireframe 5 (rows section).
- **Files involved:**
  - `app/components/SpreadsheetGrid.tsx` (hover state + insert/delete handlers)
- **Dependencies:** Task 1.1
- **Parallelizable:** Yes — can run alongside Task 5.1

### Task 8.2 — Add/Delete Columns
- **What to build:** On hover of column-letter header cell: show "+" (insert column left) and "×" (delete column) buttons. Same overlay pattern as Task 8.1. Matches wireframe 5 (columns section).
- **Files involved:**
  - `app/components/SpreadsheetGrid.tsx`
- **Dependencies:** Task 1.1
- **Parallelizable:** Yes — can run in parallel with Task 8.1

---

## Module 9 — Download Modal

**Goal:** "Download" button opens modal. User enters filename, chooses full CSV or selected range only. Generates and downloads CSV file using current delimiter.

### Task 9.1 — Download Modal & CSV Exporter
- **What to build:** Modal with: filename input (default "myexport.csv"), radio buttons for "Full CSV" vs "Selected range only" (disabled if no selection), Cancel + Download buttons. On Download: serialize current data (or selected slice) back to CSV using active delimiter, trigger browser download. Matches wireframe 6.
- **Files involved:**
  - `app/components/DownloadModal.tsx` (new)
  - `lib/csvExporter.ts` (new — serialize 2D array to CSV string with delimiter + quoting)
  - `app/components/CsvViewer.tsx` (wire Download button → modal open)
- **Dependencies:** Task 5.1 (for selected-range option), Task 2.1 (delimiter awareness)
- **Parallelizable:** No — depends on 5.1

---

## Module 10 — Toolbar & Persistence

**Goal:** Wire up the toolbar actions and auto-save all state to localStorage.

### Task 10.1 — Toolbar Component
- **What to build:** Toolbar bar at the top of the viewer (per wireframes 1, 2): "Download" button (opens modal), "Clear All" button (confirms then wipes data + resets grid), "Delimiter: Comma ▼" dropdown (Comma / Pipe / Space — re-parses current raw CSV on change), "First row as header" checkbox. Replace the ad-hoc buttons currently in CsvViewer.
- **Files involved:**
  - `app/components/Toolbar.tsx` (new)
  - `app/components/CsvViewer.tsx` (replace existing buttons with Toolbar)
- **Dependencies:** All previous modules (wires their actions)
- **Parallelizable:** No — wire-up task; do last

### Task 10.2 — localStorage Persistence
- **What to build:** Auto-save to localStorage on every data change: raw CSV string (not parsed rows), active delimiter, header-row toggle state, sort state, filter state. On page load, restore all state and re-parse. Show "All changes autosaved to localStorage" hint in status bar per wireframe 6. Extract into `lib/persistence.ts`.
- **Files involved:**
  - `lib/persistence.ts` (new — typed save/load helpers)
  - `app/components/CsvViewer.tsx` (useEffect save on state change; load on mount)
- **Dependencies:** Task 10.1 (all state must exist before saving)
- **Parallelizable:** No — final wiring task

---

## Parallelization Summary

| Can run in parallel                                          |
|--------------------------------------------------------------|
| Task 1.1 + Task 2.1                                          |
| Task 3.1 + Task 5.1 + Task 8.1 + Task 8.2 (after 1.1, 2.2) |
| Task 3.2 + Task 4.1 (after 3.1)                             |

| Must be sequential                                      |
|---------------------------------------------------------|
| 2.1 → 2.2 → 3.1 → 3.2 / 4.1                           |
| 5.1 → 6.1                                               |
| 5.1 → 7.1                                               |
| 5.1 + 2.1 → 9.1                                        |
| All → 10.1 → 10.2                                      |
