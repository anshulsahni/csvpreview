# CSV-20 — Upload JSON and convert it to CSV

## Context

[CSV-20](https://linear.app/csvpreview/issue/CSV-20) ("Enable uploading of JSON content, which then can be converted to csv & worked upon", Feature / Urgent / Todo) asks for a second input format in the viewer. Today `UploadModal` accepts `.csv` only — `accept=".csv"` on the hidden input, and `useUploadModal.isCsvFile()` (`app/components/UploadModal/hooks.ts:56`) rejects everything else with "Only .csv files are accepted".

The work is deliberately small:

1. **A pure converter**, `lib/jsonImporter.ts` — the exact mirror of the existing `lib/jsonExporter.ts`.
2. **Wiring it into the one ingestion funnel** that already exists, so `.json` files take the JSON parser and everything downstream is unchanged.

**Errors are reported exactly the way CSV parse errors are reported today**: the upload modal stays open, nothing loads, and the errors are listed in the modal's existing error panel. There is no in-app JSON editor — see Decisions.

Outcome: a user can drop a `.json` file on the viewer and land in the grid, and when the JSON cannot be converted they are told precisely what is wrong.

---

## Decisions

**Confirmed with you:**

- **CSV compatible** = one top-level array, every element a plain object, every value `string | number | true | false | null`. Keys make the header; a missing key gives an empty cell. Everything else — array of arrays, bare object, array of primitives, any nesting, malformed text — is incompatible.
- **Scope**: only the file picker and drop zone accept `.json`. The paste textarea stays CSV-only. No `/tools/json-to-csv` page. No new npm dependency.
- **No interface for fixing broken JSON.** Errors are surfaced and that is all — the same contract the CSV path has had since day one, and the comment already in `ingest` states it: *"Nothing is loaded until the input parses cleanly — the modal is the single place errors are shown."* An editable JSON pane was designed and cut as too much for now; it can be its own ticket later, and this plan is built so that adding one would not need any of it rewritten.
- **`firstRowAsHeader` is turned on for a JSON import, and the CSV path is left untouched.** JSON keys are a header by construction, so the toggle has to go on — otherwise the grid shows `A/B/C` column letters with the key row sitting in the body as data row 1. The CSV branch of `ingest` has never touched the toggle and this plan keeps it that way, so **there is no change to existing CSV behaviour**. Known consequence: after a JSON import the toggle stays on for a following CSV upload — the same stickiness it already has across sessions via `LS_KEY_FIRST_ROW_HEADER`, and the user can flip it off in the Toolbar.

**Taken in this plan, with the evidence:**

- **`fileName` stays `data.json`, not rewritten to `.csv`.** Verified: `fileName` is persisted and returned by `useCsvViewer` but rendered nowhere, and it does **not** seed the download dialog — `openDownloadWith` always calls `setDownloadBaseName(computeDefaultFilenameStem())`, the date stamp (`app/components/CsvViewer/hooks.ts:472`). Rewriting the extension buys nothing and loses the truth of what was uploaded. It also sidesteps a `stripExtension(name, ".csv")` → `people.json.csv` hazard.
- **Booleans stringify to `"true"`/`"false"`, not `TRUE`/`FALSE`.** `xlsxImporter.cellToString` upper-cases because Excel *displays* booleans that way; JSON's literals are lower case, so `String(v)` preserves the source and keeps `exportJSON` → `parseJSON` a clean round trip.
- **`null` → `""`.** Matches `rowsToJsonRecords`'s `?? ""` fill. Lossy (a `null` becomes indistinguishable from an empty string), but the alternative — the literal word `null` in a cell — is worse to look at in a grid.
- **Errors reuse `ParseError`/`ParseResult` from `lib/csvParser` via `import type`.** Type-only imports are erased at compile time, so `jsonImporter` gains no runtime coupling to papaparse. A parallel type would force a mapping layer at `setParseErrors` for no benefit — `UploadModal`'s `errors` prop is already `ParseError[]`.
- **Shape errors carry a JSON path and `line: 0`; syntax errors carry a real line where one can be recovered.** Rationale in §1.

---

## Implementation

### 1. New: `lib/jsonImporter.ts` — the converter

Mirror image of `lib/jsonExporter.ts`: pure, framework-agnostic, dependency-free, doc-commented in the same style. This is where nearly all the work and nearly all the test value sits.

```ts
import type { ParseError, ParseResult } from "./csvParser";

/** A JSON value that fits in a CSV cell. */
export type JsonCellValue = string | number | boolean | null;

/** Parse JSON text into CSV-shaped rows, header row included as row 0. */
export function parseJSON(input: string): ParseResult;

/** One JSON value → one CSV cell. Pure; implements the table below. */
export function jsonValueToCell(value: JsonCellValue): string;

/** Union of every object's keys, in first-seen order. */
export function deriveHeaderRow(records: Record<string, JsonCellValue>[]): string[];

/** Every CSV-compatibility violation in an already-parsed value, in document order. */
export function collectShapeErrors(parsed: unknown): ParseError[];

/** Turn a JSON.parse SyntaxError message into a located, user-facing ParseError. */
export function describeSyntaxError(message: string, input: string): ParseError;

/** "an object" | "an array" | "a string" | "a number" | "a boolean" | "null" */
export function describeJsonType(value: unknown): string;
```

Pipeline: empty guard → `JSON.parse` in `try/catch` → `collectShapeErrors` → `deriveHeaderRow` → map rows. A syntax error short-circuits: exactly one error, and `collectShapeErrors` never runs.

**Empty input.** `""`, `"   "`, `"[]"` and `"[{},{}]"` (header derives to `[]`) all return `{ rows: [], errors: [] }`, mirroring `parseCSV`'s early return at `lib/csvParser.ts:115`. The existing `rows.length === 0` guard in `ingest` turns all four into the shared `"No data found"` error, so the empty rule stays in one place and no new branch is needed.

**Line numbers out of `JSON.parse`.** The message wording is engine- *and input-* dependent. Measured on the Node 24 / V8 this repo runs:

| Input | `SyntaxError.message` |
|---|---|
| `{bad}` | `Expected property name or '}' in JSON at position 1 (line 1 column 2)` |
| `[1,2,3]extra` | `Unexpected non-whitespace character after JSON at position 7 (line 1 column 8)` |
| `[{"a":1},\n {"b":\n]` | `Unexpected token ']', "…" is not valid JSON` — **no position** |
| `[{"id":1},` | `Unexpected end of JSON input` — **no position** |

There is no standard `position` property on the error object, only `message` and `stack`. So `describeSyntaxError(message, input)` extracts in three tiers:

1. `/\bat position (\d+)/` → count `\n` in `input.slice(0, position)` and add 1. Computing the line ourselves rather than trusting the parenthesised `line X` is engine-agnostic and handles CRLF correctly.
2. else `/\bline (\d+)/` → use it directly (Firefox: `JSON.parse: unexpected character at line 2 column 3 of the JSON data`).
3. else `line: 0` (Safari's `JSON Parse error: Unexpected identifier`, and the two positionless V8 cases above).

The returned message is `Invalid JSON: ${cleaned}`, where `cleaned` strips a trailing ` in JSON at position N (line X column Y)` clause when a line *was* extracted — otherwise the panel renders the redundant `Line 3: … (line 3 column 11)`.

Since the user cannot fix the file in the app, **the message has to carry its own weight** — it is the only thing they get. That is why the position clause is cleaned rather than dumped raw, and why shape errors below name an exact path.

**Why this cannot go flaky:** `describeSyntaxError` takes the message as a **plain string argument**, so its unit tests feed literal V8 / Firefox / Safari strings and never call `JSON.parse`. The one integration test that does call `JSON.parse` asserts only that there is exactly one error and that `line` is a non-negative integer — never the text.

**Shape errors are located by JSON path, not line**, with `line: 0`. Rejected alternative: a location-tracking tokenizer — a few hundred lines of parser with real bug surface, for a payoff that is often nil, since minified `.json` puts every path on line 1. The path is strictly more precise in that common case. Copy:

- `Top level must be an array of objects, but found a single object. Wrap it in [ ] to convert one row.`
- `Top level must be an array of objects, but found a string.` (also `a number` / `a boolean` / `null`)
- `$[0]: expected an object, but found an array. Arrays of arrays are not supported.`
- `$[2]: expected an object, but found a number.` / `… but found null.`
- `$[0].address: nested objects are not supported — every value must be a string, number, true, false or null.`
- `$[3].tags: nested arrays are not supported — …`

`collectShapeErrors` reports **every** violation in document order, capped at `MAX_SHAPE_ERRORS = 50` with a final `{ line: 0, message: "…and 412 more issues." }`. Uncapped, a 100k-element array with one systematic flaw would produce 100k errors and lock up the list render.

**Value stringification** (`jsonValueToCell`), documented in the docblock:

| Value | Cell | Note |
|---|---|---|
| `"007"` | `"007"` | verbatim, no coercion — matches `jsonExporter` |
| `1`, `-1.5` | `"1"`, `"-1.5"` | `String(n)` |
| `1e21` | `"1e+21"` | `String` switches to exponent notation at 1e21 |
| `1e-7` | `"1e-7"` | ditto below 1e-6 |
| `12345678901234567890` | `"12345678901234567000"` | **lossy** — precision is gone inside `JSON.parse` before our code sees it. Documented and asserted by a test so it cannot regress silently. |
| `true` / `false` | `"true"` / `"false"` | see Decisions |
| `null` | `""` | see Decisions |
| key absent | `""` | |
| `NaN` / `Infinity` | — | impossible; JSON has no literal for them |

**`deriveHeaderRow`** takes the union of keys across **all** objects in first-seen order, not just the first object's — otherwise a legitimately-omitted key in element 0 silently drops a whole column. Documented quirk to test rather than fight: `Object.keys` returns integer-like keys in ascending numeric order first, so `[{"2":"a","1":"b"}]` yields header `["1","2"]`. Duplicate keys inside one object are already collapsed by `JSON.parse` (last wins).

`rows[0]` **is** the header row, so the result drops straight into `csvData: string[][]`.

### 2. New: `lib/uploadFormats.ts` — the accept-list registry

Counterpart to the existing `lib/downloadFormats.ts`.

```ts
export type UploadFormat = "csv" | "json";

export interface UploadFormatSpec {
  label: string;        // "CSV" | "JSON"
  extension: string;    // ".csv" | ".json"
  mimeTypes: string[];  // ["text/csv"] | ["application/json", "text/json"]
}

export const UPLOAD_FORMATS: Record<UploadFormat, UploadFormatSpec>;

/** ".csv,.json" — the file input's accept attribute. */
export const UPLOAD_ACCEPT_ATTRIBUTE: string;

/** Format implied by a name (extension wins) or MIME type; null when unsupported. */
export function detectUploadFormat(fileName: string, mimeType?: string): UploadFormat | null;
```

Worth its own file even for one added format: three independent call sites must agree on the same list — `useUploadModal` (accept/reject), `UploadModal.tsx` (the `accept` attribute and the label copy), and `useCsvViewer.handleFilePicked` (which parser to run). Hand-writing `".csv,.json"` in JSX while a separate predicate decides acceptance is exactly the drift this prevents.

**Extension wins over MIME**, inverting today's `isCsvFile` order (MIME first, `hooks.ts:56-59`). Browsers and OSes routinely report `""` or `application/octet-stream` for `.json`, and Windows sometimes reports `application/vnd.ms-excel` for `.csv`. The inversion is behaviour-preserving for everything today's predicate accepts: `x.csv` still resolves to `csv`, and the MIME check survives as the fallback so `data.txt` with `type: "text/csv"` is still accepted.

### 3. `app/components/CsvViewer/hooks.ts` — one funnel, two parsers

The existing `ingest` keeps its shape — the error contract, the `rows.length === 0` guard and the modal-stays-open behaviour are all untouched. It gains a `format` and one conditional:

```ts
function ingest(text: string, name: string, format: UploadFormat): void {
  const { rows, errors } =
    format === "json" ? parseJSON(text) : parseCSV(text, { delimiter });

  // Malformed input: keep the upload modal open and list the errors there so
  // the user sees exactly what is wrong. Nothing is loaded until the input
  // parses cleanly — the modal is the single place errors are shown.
  if (errors.length > 0) {
    setParseErrors(errors);
    track("Upload Rejected", { format, errorCount: errors.length });
    return;
  }
  if (rows.length === 0) {
    setParseErrors([{ line: 0, message: "No data found" }]);
    track("Upload Rejected", { format, errorCount: 1 });
    return;
  }

  setParseErrors([]);
  setCsvData(rows);
  setSelectedRowBodyIndices([]);
  // JSON keys are a header by construction — without this the grid would show
  // A/B/C column letters with the key row sitting in the body as data row 1.
  // The CSV path deliberately leaves the toggle alone, exactly as it does today.
  if (format === "json") setFirstRowAsHeader(true);
  setFileName(name);
  try { localStorage.setItem(LS_KEY_FILE_NAME, name); } catch {}
  setIsUploadOpen(false);
  track("Sheet Uploaded", { format, rowCount: rows.length, columnCount: rows[0].length });
}
```

`handleFilePicked` keeps its generation token, `beginParse()`, `setLoadingDetail`, `setIsParsing`, `FileReader`, stale-parse guard and `activeReader.current?.abort?.()` **unchanged**. Two edits only:

```ts
function handleFilePicked(file: File) {
  // `useUploadModal` already rejects unsupported files, but this is a public
  // hook API — fall back to CSV so today's behaviour holds either way.
  const format = detectUploadFormat(file.name, file.type) ?? "csv";
  …unchanged…
  reader.onload = … ingest(text, file.name, format);
}
```

`handlePasteSubmit` → `ingest(text, PASTED_FILENAME, "csv")`, otherwise unchanged. `handleStartBlank`, `handleClear`, `openUpload` and `closeUpload` need **no change at all** — there is no new state to reset.

No new members on `UseCsvViewerReturn`, and **`CsvViewer.tsx` is not touched**.

### 4. `app/components/UploadModal/hooks.ts` — the file-type gate

`isCsvFile` is deleted and replaced by the shared detector:

```ts
const UNSUPPORTED_FILE_MESSAGE = "Only .csv and .json files are accepted";

function validateAndSubmitFile(file: File | undefined | null) {
  if (!file) return;
  if (detectUploadFormat(file.name, file.type) === null) {
    setFileRejectionMessage(UNSUPPORTED_FILE_MESSAGE);
    return;
  }
  setFileRejectionMessage(null);
  onFilePicked(file);
}
```

`handleDrop` still takes `dataTransfer.files[0]` only. Escape, Cmd/Ctrl+Enter, the paste box and the `isOpen === false` reset effect are **all unchanged** — no new state enters this hook.

One new pure helper, exported for unit test per AGENTS.md §1.2:

```ts
/** `Line 3: bad quote`, or the bare message when the error isn't tied to a line. */
export function formatParseError(error: ParseError): string {
  return error.line > 0 ? `Line ${error.line}: ${error.message}` : error.message;
}
```

It is needed because shape errors all carry `line: 0`, and `Line 0: $[3].tags: nested arrays…` reads like a bug. It also fixes the three pre-existing `line: 0` cases (`No data found`, `Could not read file`, `Paste area is empty`) that render as `Line 0: …` today.

### 5. `app/components/UploadModal/UploadModal.tsx` — copy, `accept`, error rendering

No structural change and no new component — the existing `ErrorPanel` is the whole error surface, exactly as for CSV.

| Line | Was | Becomes |
|---|---|---|
| 55 | `Drag a .csv file anywhere in this area` | `Drag a .csv or .json file anywhere in this area` |
| 60 | `Accepts: .csv files only` | `Accepts: .csv and .json files` |
| 65 | `accept=".csv"` | `accept={UPLOAD_ACCEPT_ATTRIBUTE}` |
| 67 | `aria-label="Choose a .csv file"` | `aria-label="Choose a .csv or .json file"` |
| 74 | `— or paste CSV below —` | **unchanged** — reinforces that paste is CSV-only |
| 105-107 | `Line {error.line}: {error.message}` | `{formatParseError(error)}` |

`ErrorList`'s `max-height: 160px; overflow: auto` already handles a long list, so the capped 51-entry worst case scrolls rather than blowing out the dialog.

### 6. Design tokens — fixing the §1.3 violations in the touched code

`ErrorPanel` is the component this ticket leans on hardest, and it is currently light-mode-only hardcoded hex, which breaks AGENTS.md §1.3:

- `RejectionMessage`'s `color: #dc2626` → `var(--error)`. The token already exists at `app/globals.css:16` as `light-dark(#dc2626, #ef4444)` and has no consumer yet; its light value is an exact match.
- `ErrorPanel`'s `border: 1px solid #fca5a5`, `background: rgba(220, 38, 38, 0.08)`, `color: #b91c1c` have no tokens. Add three to `app/globals.css`:
  ```css
  --error-foreground: light-dark(#b91c1c, #fca5a5);
  --error-border: light-dark(#fca5a5, #7f1d1d);
  --error-bg: light-dark(rgba(220, 38, 38, 0.08), rgba(239, 68, 68, 0.12));
  ```
  This is a real bug fix, not scope creep: `#b91c1c` on `#0a0a0a` is close to unreadable in dark mode today, and now that the panel is the *only* thing a user gets when their JSON is bad, it has to be legible.

Explicitly **out** of scope, recorded so the decision isn't lost: `CloseButton`'s `#e11d48`/`#be123c` (→ `--danger`/`--danger-hover`), `DropZone`'s `#60a5fa`, the buttons' `#ffffff`, `StartBlankButton`'s `rgba(0,112,243,0.08)`. Worth a separate cleanup ticket.

### 7. Analytics — `lib/analytics.ts`

Two events in house style (Title Case, past-tense verb; camelCase properties), both fired from the single `ingest` funnel:

- `track("Sheet Uploaded", { format, rowCount, columnCount })` — `format: "csv" | "json"`. The app tracks `Sheet Downloaded` but has **no upload event at all** today; this closes that gap for CSV too.
- `track("Upload Rejected", { format, errorCount })` — this is the number that will tell us later whether a JSON fix interface is worth building.

**Never send the JSON text, the filename, or any error message** — messages embed user key names like `$[0].address`. Counts only.

---

## Tests

**New:**

- **`__tests__/lib/jsonImporter.test.ts`** — one top-level `describe` per export; carries most of the ticket's value.
  - `parseJSON` happy path: `[{"a":1,"b":"x"}]` → `[["a","b"],["1","x"]]`; `"007"` stays `"007"`; unicode and keys containing commas/quotes preserved.
  - Header union: `[{"b":1},{"a":2}]` → `[["b","a"],["1",""],["","2"]]`.
  - Empty: `""`, `"   "`, `"[]"`, `"[{},{}]"` → `{ rows: [], errors: [] }`.
  - Integer-like key quirk: `[{"2":"a","1":"b"}]` → header `["1","2"]`.
  - **Round trip**: `parseJSON(exportJSON(["id","name"], [["1","Ann"]]))` → `[["id","name"],["1","Ann"]]` — the one test pinning importer and exporter together.
  - Syntax: `"{"` → exactly one error, message starts `Invalid JSON: `, `line` a non-negative integer. **No assertion on engine wording.**
  - `jsonValueToCell`: the full §1 table, including `1e21 → "1e+21"`, `1e-7 → "1e-7"` and `12345678901234567890 → "12345678901234567000"` as the precision-loss guard.
  - `deriveHeaderRow`: union order; `[]` → `[]`; `[{},{}]` → `[]`.
  - `collectShapeErrors` (called on already-parsed values, no `JSON.parse` involved): bare object incl. the `Wrap it in [ ]` hint; top-level string / number / `true` / `null`; array of arrays → `$[0]`; array of primitives → `$[2]`; element `null` → `$[1]`; nested object → `$[0].address`; nested array → `$[2].tags`; multiple violations in document order; 500 violations → exactly 51 errors ending `…and 451 more issues.`; clean value → `[]`.
  - `describeSyntaxError` — the engine-independence suite, fed **literal message strings**: V8's `position N (line X column Y)` form → correct line; a fabricated `at position 5` with no parenthesised line → line computed from the supplied input; a CRLF input → correct line; Firefox's `at line 2 column 3 of the JSON data` → 2; Safari's `JSON Parse error: Unexpected identifier` → 0; V8's `Unexpected end of JSON input` → 0; a position past the end of input → clamped, no throw. Also assert the position clause is stripped when a line was found.
  - `describeJsonType`: all six branches.

- **`__tests__/lib/uploadFormats.test.ts`** — `.csv`/`.CSV` → `"csv"`; `.json`/`.JSON` → `"json"`; `("a.txt","text/csv")` → `"csv"` (MIME fallback preserved); `("a.txt","application/json")` → `"json"`; `("a.json","text/csv")` → `"json"` (extension beats MIME); `.xlsx`, bare `.txt`, `""` → `null`; `UPLOAD_ACCEPT_ATTRIBUTE === ".csv,.json"`.

**Updated:**

- **`__tests__/components/UploadModal/UploadModal.test.tsx`** — the `.csv`-only assertions at lines 23, 26, 40-43 become the new copy and `accept=".csv,.json"`. One new case: an error with `line: 0` renders as the bare message with **no `Line 0:` prefix**, while `line: 3` still renders `Line 3: …`.
- **`__tests__/components/UploadModal/hooks.test.ts`** — the `"Only .csv files are accepted"` assertions at lines 130, 153, 367 become the new copy. New: a `.json` file is accepted on drop and via `handleFileInputChange`; an `.xlsx` file is still rejected. Plus `describe("formatParseError")` for both branches. Reuse the existing `makeArgs` / `makeDragEvent` / `makeChangeEvent` factories and the `KeyboardShortcutsProvider` wrapper.
- **`__tests__/components/CsvViewer/hooks.test.ts`** — extend the existing `mockFileReaderWithText` / `mockPendingFileReader` helpers near the top of the file with JSON payloads. New: a valid `.json` file → `csvData[0]` is the header row, `firstRowAsHeader === true`, `fileName === "data.json"` (not rewritten), `LS_KEY_FILE_NAME === "data.json"`, modal closed; malformed `.json` → `parseErrors` set, `csvData` still null, modal still open; shape-incompatible `[[1,2]]` → the message contains `$[0]`; `.json` containing `[]` → `No data found`; the stale-parse guard holds for the JSON path via `mockPendingFileReader`. **Regression guard: with `firstRowAsHeader` already on, a CSV upload leaves it on** — the CSV path must not start touching the toggle. No existing case in this file needs changing. Analytics assertions come free (`jest.mock("@/lib/analytics", …)` is already at line 16): assert `Sheet Uploaded` with `{ format: "json" }` and `Upload Rejected` with `{ format: "json", errorCount: 1 }`.

---

## Verification

1. `npm test` — full suite green (CI runs `npm test -- --coverage`).
2. `npx tsc --noEmit` and `npm run lint`.
3. `npm run dev`, then in the browser, in **both light and dark themes** (the error panel is now the entire failure experience, so its readability is part of this ticket):
   - **Happy path** — save as `people.json` and drop it on the modal:
     ```json
     [{"id":1,"name":"Ann","active":true,"score":9.5,"note":null},
      {"id":2,"name":"Bob","active":false,"score":7}]
     ```
     Expect: modal closes; header `id, name, active, score, note`; **"First row as header" already on**; Ann's `note` empty; `active` reads lower-case `true`/`false`; Bob's `note` empty (missing key). Reload and confirm the sheet and the toggle survive.
   - In every failing case below, expect the same thing: **the modal stays open, nothing loads, and the errors are listed in the panel** — identical to a malformed CSV today.
   - **Malformed JSON** — `[{"a":1},{"b":2,,}]` → roughly `Line 1: Invalid JSON: Expected double-quoted property name`, with no trailing `at position …`.
   - **Not JSON at all** — a file containing `hello world` → a bare `Invalid JSON: Unexpected token 'h'…` with **no `Line 0:` prefix**.
   - **Bare object** — `{"a":1}` → the `Wrap it in [ ]` message.
   - **Array of arrays** — `[[1,2],[3,4]]` → `$[0]: expected an object, but found an array…`.
   - **Array of primitives** — `[1,2,3]` → `$[0]: expected an object, but found a number.`
   - **Nested value** — `[{"a":1,"address":{"city":"X"}},{"a":2,"tags":["x"]}]` → **two** errors, `$[0].address` then `$[1].tags`, in that order.
   - **Empty array** — `[]` → `No data found`.
   - **Many errors** — a file where every element is a nested object → a capped list ending `…and N more issues.`, scrolling inside the panel rather than blowing out the dialog.
   - **Recovery** — after a failure, pick a good `.csv` from the still-open modal and confirm it loads and the errors clear.
   - **Round trip** — load a CSV with the header toggle on, `Download as JSON`, upload that file back. Expect an identical sheet.
   - **Regression** — CSV upload, CSV paste, `.xlsx` rejection copy (`Only .csv and .json files are accepted`), Escape-to-close, backdrop-click-to-close. **And the toggle: turn "First row as header" on, upload a CSV, confirm it is still on.**

---

## Risks

- **Main-thread blocking on large JSON.** `JSON.parse` is synchronous, and the shape walk plus row build are two further full passes — three where `parseCSV` does roughly one. `LoadingOverlay` already covers it (`handleFilePicked` sets `isParsing` before the async `FileReader`), so it is the same risk class the app already accepts for CSV, with a larger constant. No Web Worker here — that is its own ticket, for both parsers.
- **Memory.** A JSON array expands to an object graph several times its text size, alive at the same time as the `string[][]` being built. Both are released as soon as `ingest` returns — because a failure keeps no copy of the raw text, only the `ParseError[]`.
- **Number precision is silently lossy** above 2^53, inside `JSON.parse` before our code runs. Documented and locked by a test.
- **`null` and `""` become indistinguishable**, so `null` does not survive a round trip back to JSON.
- **`localStorage` quota.** A large import makes the persist effect throw `QuotaExceededError`, already swallowed at `CsvViewer/hooks.ts:277-281` — the sheet works but silently stops persisting. Pre-existing, but easier to hit with JSON.
- **Engine-dependent syntax messages.** Mitigated structurally: line extraction is a pure function taking the message as an argument, tested against all three engines' literal strings, with `line: 0` as the always-safe fallback.
- **A user with a bad JSON file has to fix it outside the app.** That is the accepted trade of cutting the fix interface. The `Upload Rejected` event is what will tell us whether it needs revisiting.

---

## Critical files

- `lib/jsonImporter.ts` — new; mirror of `lib/jsonExporter.ts`
- `lib/uploadFormats.ts` — new; `detectUploadFormat`, `UPLOAD_ACCEPT_ATTRIBUTE`
- `app/components/CsvViewer/hooks.ts` — `ingest` gains a `format`; `handleFilePicked` detects it
- `app/components/UploadModal/hooks.ts` — file-type gate, `formatParseError`
- `app/components/UploadModal/UploadModal.tsx` — copy, `accept`, error-line rendering
- `app/globals.css` — three new error tokens
