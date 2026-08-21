# CSV-11 — Download CSV content as JSON

## Context

[CSV-11](https://linear.app/csvpreview/issue/CSV-11/implement-support-for-downloading-the-csv-content-as-json) asks for a secondary download format in the viewer. Today the Download button in `CsvViewer` only ever produces a `.csv` file: `DownloadControl` opens `DownloadModal` (filename rename dialog), which hands a filename back to `useCsvViewer.handleDownload`, which runs `exportCSV()` and triggers a blob download.

Users working with a sheet that has a header row often want the same data as an array of JSON objects. The ticket wants that offered as a **secondary** option inside the existing download split-button dropdown — CSV stays the default primary action — gated on "first row as header" being on, since without a header row there are no keys to build objects from.

CSV-11 also owns the groundwork for [CSV-13](https://linear.app/csvpreview/issue/CSV-13) (TSV / pipe / space separators): the format registry and the format-aware filename dialog built here are what CSV-13 will extend, so they're designed to take more formats without rework.

### Decisions taken (confirmed with the user)

- **One JSON entry**, not a JSON twin per scope. `Download as JSON` exports the same rows the primary button would (the visible/filtered set).
- **Locked extension suffix in the dialog now** (CSV-13's UX pulled forward): the input holds the base name only, and the extension renders beside it as an uneditable chip.
- **Conversion semantics**: uniform objects keyed by header index. Row shorter than header → missing keys emitted as `""`. Row longer than header → extra cells dropped. Duplicate header names → later column wins (natural object-assignment order). Empty header cell stays as key `""`. All values are strings, verbatim.
- **Disabled-state copy**: native `title` tooltip on the disabled menu item, no inline hint line.

---

## Implementation

### 1. New: `lib/downloadFormats.ts` — the format registry

Framework-agnostic, dependency-free (open-sourcing friendly), and the extension point CSV-13 will add `tsv`/`psv`/`ssv` to.

```ts
export type DownloadFormat = "csv" | "json";

export interface DownloadFormatSpec {
  label: string;      // "CSV" | "JSON" — used in the modal title
  extension: string;  // ".csv" | ".json"
  mimeType: string;   // "text/csv;charset=utf-8" | "application/json;charset=utf-8"
}

export const DOWNLOAD_FORMATS: Record<DownloadFormat, DownloadFormatSpec>;

/** Append `extension` unless `filename` already ends with it (case-insensitive). */
export function ensureExtension(filename: string, extension: string): string;

/** Strip a trailing `extension` (case-insensitive) — used to seed the modal's base-name input. */
export function stripExtension(filename: string, extension: string): string;
```

### 2. New: `lib/jsonExporter.ts` — the converter

Sibling to `lib/csvExporter.ts` / `lib/xlsxExporter.ts`; pure, unit-testable, no React.

```ts
/** One CSV body row → one object, keyed by the header row's cells (by index). */
export function rowsToJsonRecords(
  headerRow: string[],
  bodyRows: string[][]
): Record<string, string>[];

/** Serialize to pretty-printed JSON text (2-space indent). */
export function exportJSON(headerRow: string[], bodyRows: string[][]): string;
```

`rowsToJsonRecords` iterates **header indices** (not row indices), so short rows fill with `""` and long rows lose their tail — which is exactly the agreed behaviour. Duplicate keys fall out of assignment order for free.

### 3. `app/components/DownloadModal/` — make it format-aware with a locked suffix

`hooks.ts`:
- `DownloadOptions` grows a `format: DownloadFormat` field; `DownloadModalRenderProps` grows `format: DownloadFormat` and swaps `defaultFilename` for `defaultBaseName` (extension-free).
- The hook's state becomes the **base name**; `handleSubmit` emits `{ filename: ensureExtension(baseName.trim() || computeDefaultFilenameStem(), spec.extension), format }`.
- Add `computeDefaultFilenameStem(date = new Date())` → `csvpreview-export-YYYY-MM-DD`.
- Keep `computeDefaultFilename(date?)` and **`ensureCsvExtension(filename)`** exported and behaviour-identical, reimplemented on top of the new helpers. `ensureCsvExtension` has a second consumer — `app/tools/excel-to-csv/components/ExcelToCsvConverter/hooks.ts:5,132,337,377` — that must not change.
- Expose `extension` and `title` (`Download ${spec.label}`) on the hook's return so `DownloadModal.tsx` stays render-only.

`DownloadModal.tsx`:
- Title from the hook (`Download CSV` / `Download JSON`).
- Filename field becomes a bordered `FilenameRow` flex container holding a borderless `FilenameInput` plus an `ExtensionChip`. Move the border/radius/background off the input onto the row and use `&:focus-within { outline: 2px solid var(--primary); }` so it still reads as one control.
- Wire `aria-describedby="download-filename-extension"` on the input to the chip (id on the chip), so the locked extension is announced rather than hidden.

`app/globals.css`: add a `--muted-foreground: light-dark(#6b7280, #9ca3af);` token for the chip — per guideline 1.3, no one-off literal colours.

### 4. `app/components/Dropdown/Dropdown.tsx` — disabled + separator support

`MenuItem` has no `&:disabled` rule today. Add one (`opacity: 0.4; cursor: not-allowed;` and suppress the hover background), matching the disabled precedent in `CopyControl.tsx:164`. Add a small `DropdownSeparator` (`role="separator"`, 1px `var(--border)` rule) and export it from `app/components/Dropdown/index.ts`.

### 5. `app/components/CsvViewer/DownloadControl.tsx`

- New props: `canDownloadJson: boolean`, `onDownloadJson: () => void`.
- **Drop the `extraOptions.length === 0` early-return** — the JSON entry means the dropdown is now never empty, so the control is always the split button. This is what the ticket describes ("a small dropdown button on right side, in the same manner the copy button gets converted").
- Menu order: existing scope extras → `<DropdownSeparator />` (only when extras exist) → `Download as JSON`.
- When `canDownloadJson` is false, render that item `disabled` with `aria-disabled="true"` and `title='Enable "First row as header" to download JSON'`.
- Everything else (Escape via `useKeyboardShortcuts`, blur-close on `Split`, caret aria wiring) is unchanged.

### 6. `app/components/CsvViewer/hooks.ts`

- New state `downloadFormat: DownloadFormat` alongside the existing `downloadSource` — the two dimensions stay orthogonal, so no scope logic changes.
- New `openDownloadJson()`: sets format `"json"`, source `"visible"`, opens the modal. The three existing `openDownload*` fns set format `"csv"`.
- Replace `downloadFilename` state with a base-name (`computeDefaultFilenameStem()`); the hook returns it as `defaultDownloadBaseName`.
- Expose `canDownloadJson: exportState.headerRow !== null` — exact, since `headerRow` is non-null only when `firstRowAsHeader` is on *and* there is data (`SpreadsheetGrid/hooks.ts:213-224`).
- `handleDownload(options)`: keep the existing source resolution, then branch on `options.format`:
  - `csv` → `exportCSV(computeDownloadRows(sourceRows, exportState.headerRow), delimiter)`
  - `json` → `exportJSON(exportState.headerRow ?? [], sourceRows)` — note `computeDownloadRows` is deliberately **not** used here; the header row becomes keys, not a record.
- **Delete the local `triggerCsvDownload` (lines 119-129)** and use the canonical `downloadBlob` from `lib/downloadFile.ts` with the MIME type from `DOWNLOAD_FORMATS`. That helper's own docblock says this idiom "was previously inlined in `CsvViewer/hooks.ts`" — CsvViewer is the one caller that never migrated. Precedent: `app/tools/csv-to-excel/.../hooks.ts:190,196`.
- Add `track("Sheet Downloaded", { format, scope: downloadSource })` (`lib/analytics.ts`) — the modal's submit button reads just "Download" for both formats, so the global delegated click listener in `AnalyticsProvider.tsx` can't distinguish them. Follows the converter precedent (`track("Excel Downloaded", …)`).

### 7. `app/components/CsvViewer/CsvViewer.tsx`

Pass `canDownloadJson` / `onDownloadJson` to `DownloadControl`, and `format={viewer.downloadFormat}` + `defaultBaseName={viewer.defaultDownloadBaseName}` to `DownloadModal`. No other JSX changes.

---

## Tests

New:
- `__tests__/lib/jsonExporter.test.ts` — modelled on `__tests__/lib/csvExporter.test.ts`. Cover: happy path; short row → `""` fills; long row → tail dropped; duplicate header names → later wins; empty header cell → `""` key; empty body → `[]`; values stay verbatim strings (`"007"` does not become `7`).
- `__tests__/lib/downloadFormats.test.ts` — `ensureExtension` / `stripExtension`, including case-insensitive matching and preserved original case.
- `__tests__/components/CsvViewer/DownloadControl.test.tsx` — dropdown always rendered; JSON item enabled fires `onDownloadJson`; JSON item disabled with the `title` reason when `canDownloadJson` is false. Wrap in `KeyboardShortcutsProvider` (see `__tests__/components/FilterDropdown/FilterDropdown.test.tsx:70-83`).

Update:
- `__tests__/components/DownloadModal/hooks.test.ts` — new `defaultBaseName`/`format` props, `computeDefaultFilenameStem`, `.json` submit path; keep the existing `ensureCsvExtension` assertions green.
- `__tests__/components/DownloadModal/DownloadModal.test.tsx` — dialog accessible name `Download JSON` when `format="json"`, and the extension chip renders.
- `__tests__/components/CsvViewer/hooks.test.ts` — `handleDownload` for both formats with `jest.mock("@/lib/downloadFile", () => ({ downloadBlob: jest.fn() }))` (precedent: `__tests__/components/CsvToExcelConverter/hooks.test.ts:15`); assert the JSON path does *not* prepend the header row.
- `__tests__/components/ExcelToCsvConverter/hooks.test.ts` — should still pass untouched; treat it as the regression guard on `ensureCsvExtension`.

---

## Verification

1. `npm test` — full suite green (CI runs `npm test -- --coverage`).
2. `npx tsc --noEmit` and `npm run lint`.
3. `npm run dev`, then manually:
   - Load a CSV. With **"First row as header" off**, open the download dropdown → `Download as JSON` is dimmed and hovering shows the reason.
   - Turn the header toggle **on** → the item enables. Click it → dialog titled **Download JSON**, base name editable, `.json` shown as a locked chip. Download and confirm the file is `csvpreview-export-<today>.json` containing an array of objects keyed by the header row, all values strings.
   - Confirm the plain **Download** primary button still yields the identical `.csv` as before (regression on the `downloadBlob` swap).
   - Apply a filter and re-check: JSON reflects the filtered/visible rows; `Download all rows` / `Download selected rows` still produce CSV.
   - Feed a ragged CSV (a row with fewer and one with more cells than the header) and verify the fill/drop behaviour.
