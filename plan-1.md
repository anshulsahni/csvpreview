# CSV-20 — Upload JSON, convert it to CSV, fix it in place when it is not compatible

## Context

[CSV-20](https://linear.app/csvpreview/issue/CSV-20) ("Enable uploading of JSON content, which then can be converted to csv & worked upon", Feature / Urgent / Todo) asks for a second input format in the viewer. Today `UploadModal` accepts `.csv` only — `accept=".csv"` on the hidden input, and `useUploadModal.isCsvFile()` (`app/components/UploadModal/hooks.ts:56`) rejects everything else with "Only .csv files are accepted".

The ticket's description was half-written: it required the JSON to be "CSV compatible" without defining that, and asked for "an interface where I can fix the error" without saying what the interface is. Both gaps were settled with you before planning (see Step 0).

The feature has two halves:

1. **A pure converter**, `lib/jsonImporter.ts` — the exact mirror of the existing `lib/jsonExporter.ts`.
2. **A new mode for the upload modal.** When the JSON cannot be converted, the modal stops being an upload dialog and becomes a JSON editor with the errors listed underneath and a "Convert again" button.

The constraint that shapes the design: **the raw file text only ever exists inside `useCsvViewer.handleFilePicked`'s `FileReader.onload`.** `UploadModal` never sees it. So the fix pane's seed text must flow down as a prop, exactly as `errors` already does.

Outcome: a user can drop a `.json` file on the viewer and land in the grid, and when the JSON is wrong they can correct it in the modal and retry without leaving the app.

---

## Step 0 — Ticket description (done)

CSV-20's description has been updated in Linear to the text below — description only, no priority or label change, per `.claude/skills/linear-ticket/SKILL.md`. The original three bullets are kept verbatim; the new lines fill the two gaps and record the scope decision. Light nesting matches CSV-32's house style.

```markdown
* As a user, I should be able to upload a JSON file, while uploading, which will then be converted to csv give shape of JSON  is CSV compatible.
  * A JSON file is CSV compatible only when it is one array of objects, and every value in those objects is a plain value — text, number, true, false or null.
  * The keys of the objects make the header row. A key that an object does not have gives an empty cell.
  * Nothing else is compatible — an array of arrays, one bare object, an array of plain values, a nested object or array inside a value, or text that is not valid JSON.
  * In case, shape of JSON isn't CSV compatible, show me the exact error and provide me with an interface, where I can fix the error. 
  * The csv incompatibility also covers malformed JSON
* As a user, when my JSON is not compatible, I want the upload modal to show my JSON in a box I can edit, with the errors below it, so that I can correct the JSON and try again without leaving the app.
* For now only the file picker and the drag and drop area take .json files. The paste box stays CSV only. A json-to-csv tool page is a separate ticket.
```

---

## Decisions already taken

**Confirmed with you:**

- **CSV compatible** = one top-level array, every element a plain object, every value `string | number | true | false | null`. Keys make the header; a missing key gives an empty cell. Everything else — array of arrays, bare object, array of primitives, any nesting, malformed text — is incompatible.
- **Scope**: only the file picker and drop zone accept `.json`. The paste textarea stays CSV-only. No `/tools/json-to-csv` page. No new npm dependency — a plain monospace `<textarea>`, no CodeMirror/Monaco.
- **Escape in the fix pane** exits fix mode first; a second press closes the modal. This diverges from the app's other modals (one Escape always closes) and is a deliberate trade to protect the user's edits.
- **`firstRowAsHeader` is turned on for a JSON import, and the CSV path is left untouched.** JSON keys are a header by construction, so the toggle has to go on — otherwise the grid shows `A/B/C` column letters with the key row sitting in the body as data row 1. The CSV branch of `ingest` has never touched the toggle and this plan keeps it that way, so **there is no change to existing CSV behaviour**. Known consequence, and the reason the alternative was considered: after a JSON import the toggle stays on for a following CSV upload. That is the same stickiness the toggle already has across sessions via `LS_KEY_FIRST_ROW_HEADER`, and the user can flip it off in the Toolbar.

**Taken in this plan, with the evidence:**

- **`fileName` stays `data.json`, not rewritten to `.csv`.** Verified: `fileName` is persisted and returned by `useCsvViewer` but rendered nowhere, and it does **not** seed the download dialog — `openDownloadWith` always calls `setDownloadBaseName(computeDefaultFilenameStem())`, the date stamp (`app/components/CsvViewer/hooks.ts:472`). Rewriting the extension buys nothing and loses the truth of what was uploaded. It also sidesteps a `stripExtension(name, ".csv")` → `people.json.csv` hazard.
- **Booleans stringify to `"true"`/`"false"`, not `TRUE`/`FALSE`.** `xlsxImporter.cellToString` upper-cases because Excel *displays* booleans that way; JSON's literals are lower case, so `String(v)` preserves the source and keeps `exportJSON` → `parseJSON` a clean round trip.
- **`null` → `""`.** Matches `rowsToJsonRecords`'s `?? ""` fill. Lossy (a `null` becomes indistinguishable from an empty string), but the alternative — the literal word `null` in a cell — is worse to look at in a grid.
- **Errors reuse `ParseError`/`ParseResult` from `lib/csvParser` via `import type`.** Type-only imports are erased at compile time, so `jsonImporter` gains no runtime coupling to papaparse. A parallel type would force a mapping layer at `setParseErrors` for no benefit — `UploadModal`'s `errors` prop is already `ParseError[]`.
- **Shape errors carry a JSON path and `line: 0`; syntax errors carry a real line where one can be recovered.** Rationale in §1.

---

## Implementation

### 1. New: `lib/jsonImporter.ts` — the converter

Mirror image of `lib/jsonExporter.ts`: pure, framework-agnostic, dependency-free, doc-commented in the same style.

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

**Empty input.** `""`, `"   "`, `"[]"` and `"[{},{}]"` (header derives to `[]`) all return `{ rows: [], errors: [] }`, mirroring `parseCSV`'s early return at `lib/csvParser.ts:115`. The existing `rows.length === 0` guard in `ingest` turns all four into the shared `"No data found"` error, so the empty rule stays in one place.

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

**Why this cannot go flaky:** `describeSyntaxError` takes the message as a **plain string argument**, so its unit tests feed literal V8 / Firefox / Safari strings and never call `JSON.parse`. The one integration test that does call `JSON.parse` asserts only that there is exactly one error and that `line` is a non-negative integer — never the text.

**Shape errors are located by JSON path, not line**, with `line: 0`. Rejected alternative: a location-tracking tokenizer — a few hundred lines of parser with real bug surface, for a payoff that is often nil, since minified `.json` puts every path on line 1. The path is strictly more precise in that common case, and the fix pane puts the raw text in a searchable textarea. Copy:

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

New state, next to `parseErrors`:

```ts
export interface JsonFixState {
  /** Raw JSON text of the last failed conversion — seeds the fix editor. */
  source: string;
  /** File it came from; reused as the filename when the retry succeeds. */
  fileName: string;
}

const [jsonFix, setJsonFix] = useState<JsonFixState | null>(null);
```

`ingest` moves to an options object so the three call sites read clearly and the analytics `source` rides along:

```ts
interface IngestOptions {
  text: string;
  name: string;
  format: UploadFormat;
  source: "file" | "paste" | "jsonFix";
}

function ingest({ text, name, format, source }: IngestOptions): void {
  const { rows, errors } =
    format === "json" ? parseJSON(text) : parseCSV(text, { delimiter });

  const issues =
    errors.length > 0
      ? errors
      : rows.length === 0
        ? [{ line: 0, message: "No data found" }]
        : [];

  if (issues.length > 0) {
    setParseErrors(issues);
    // A failed JSON conversion hands the raw text to the modal's fix pane.
    // The CSV path deliberately does not — the paste box stays CSV-only.
    if (format === "json") setJsonFix({ source: text, fileName: name });
    track("Upload Rejected", { format, source, errorCount: issues.length });
    return;
  }

  setParseErrors([]);
  setJsonFix(null);
  setCsvData(rows);
  setSelectedRowBodyIndices([]);
  // JSON keys are a header by construction — without this the grid would show
  // A/B/C column letters with the key row sitting in the body as data row 1.
  // The CSV path deliberately leaves the toggle alone, exactly as it does today.
  if (format === "json") setFirstRowAsHeader(true);
  setFileName(name);
  try { localStorage.setItem(LS_KEY_FILE_NAME, name); } catch {}
  setIsUploadOpen(false);
  track("Sheet Uploaded", { format, source, rowCount: rows.length, columnCount: rows[0].length });
}
```

Folding the two failure branches into one `issues` array is what lets the fix pane open for `"No data found"` (empty array, all-empty objects) as well as for real syntax and shape errors — in all of those the user's next move is the same: edit the JSON.

`handleFilePicked` keeps its generation token, `beginParse()`, `setLoadingDetail`, `setIsParsing`, `FileReader`, stale-parse guard and `activeReader.current?.abort?.()` **unchanged**. Two edits only:

```ts
function handleFilePicked(file: File) {
  // `useUploadModal` already rejects unsupported files, but this is a public
  // hook API — fall back to CSV so today's behaviour holds either way.
  const format = detectUploadFormat(file.name, file.type) ?? "csv";
  …unchanged…
  reader.onload = … ingest({ text, name: file.name, format, source: "file" });
}
```

`handlePasteSubmit` → `ingest({ text, name: PASTED_FILENAME, format: "csv", source: "paste" })`, otherwise unchanged.

New, deliberately reusing `handlePasteSubmit`'s `beginParse` / `runAfterPaint` scaffolding rather than a second mechanism:

```ts
function handleJsonFixSubmit(text: string) {
  if (text.trim() === "") {
    setParseErrors([{ line: 0, message: "The editor is empty" }]);
    return;
  }
  const name = jsonFix?.fileName ?? "pasted.json";
  const generation = beginParse();
  setLoadingDetail(name);
  setIsParsing(true);
  runAfterPaint(() => {
    if (generation !== parseGeneration.current) return;
    ingest({ text, name, format: "json", source: "jsonFix" });
    setIsParsing(false);
  });
}

/** Leave the fix pane and return to the normal upload view. */
function exitJsonFix() {
  setJsonFix(null);
  setParseErrors([]);
}
```

`setJsonFix(null)` joins every existing `setParseErrors([])` reset: `openUpload`, `closeUpload`, `handleStartBlank`, `handleClear`. New on `UseCsvViewerReturn`: `jsonFix`, `handleJsonFixSubmit`, `exitJsonFix`. `CsvViewer.tsx` passes the three new props to `<UploadModal>` — no other JSX change.

### 4. `app/components/UploadModal/hooks.ts` — gate, draft state, Escape

The gate — `isCsvFile` is deleted:

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

`handleDrop` still takes `dataTransfer.files[0]` only — multi-file stays out of scope.

**Where the draft lives.** `useCsvViewer` owns the **source** (`jsonFix` — only it can read the file). `useUploadModal` owns the **draft** (`jsonDraft`, the per-keystroke editor state). Splitting them is deliberate: a draft in `useCsvViewer` would re-render the whole viewer — `SpreadsheetGrid` included, whenever the modal sits over loaded data — on every keystroke, and AGENTS.md §1.2 says keep state local to its owner.

Seeding a draft from a prop is the derived-state trap, so use React's adjust-during-render pattern rather than an effect:

```ts
const [jsonDraft, setJsonDraft] = useState("");
const [seededFrom, setSeededFrom] = useState<string | null>(null);
// Re-seed only when a *different* JSON arrives. A retry that fails with the
// same text leaves the caret and the user's edits exactly where they were.
if ((jsonFix?.source ?? null) !== seededFrom) {
  setSeededFrom(jsonFix?.source ?? null);
  setJsonDraft(jsonFix?.source ?? "");
}
```

Strings compare by value, so all four cases behave: new bad file → reseed; edit + failed retry (`source` becomes the edited text) → reseed to the same text, invisible; edit without retry → no reseed; exit fix mode (`source → null`) → draft cleared. `jsonDraft` and `seededFrom` also join `pastedText` in the existing `isOpen === false` reset effect (`hooks.ts:108`).

**Escape** — per your decision, the existing Escape registration becomes two-stage:

```ts
useKeyboardShortcuts({ primaryKey: Keys.Escape }, () => {
  // The fix pane holds text the user typed; one keystroke must not discard it.
  if (jsonFix !== null) { onExitJsonFix(); return; }
  onClose();
}, [jsonFix, onExitJsonFix, onClose], { enabled: isOpen });
```

**Cmd/Ctrl+Enter.** `handlePasteSubmitShortcut` already checks `event.target === pasteAreaElement`; extend that same handler to dispatch on which element is focused — JSON editor → `submitJsonFix()`, paste area → `submitPastedText()` — keeping the two existing registrations (`allowInEditable: true`) rather than adding two more. The editor element reaches the hook through a `jsonEditorElement` arg, mirroring the existing `pasteAreaElement` callback-ref-to-state pattern in `UploadModal.tsx:19-23`.

**Focus**: on entering fix mode, focus the editor with the caret at position 0 — not select-all; the user needs to navigate to the error, not replace everything.

New pure helper, exported for unit test per §1.2:

```ts
/** `Line 3: bad quote`, or the bare message when the error isn't tied to a line. */
export function formatParseError(error: ParseError): string {
  return error.line > 0 ? `Line ${error.line}: ${error.message}` : error.message;
}
```

It exists because shape errors all carry `line: 0` and `Line 0: $[3].tags: …` reads like a bug. It also fixes the three pre-existing `line: 0` cases (`No data found`, `Could not read file`, `Paste area is empty`) that render as `Line 0: …` today.

New on `UseUploadModalReturn`: `isFixingJson`, `jsonDraft`, `setJsonDraft`, `submitJsonFix`, `handleExitJsonFix`, `canSubmitJsonFix`.

**No split hook file.** AGENTS.md §1.2 permits one, but the fix-pane state is ~6 lines plus three handlers, and it shares the `isOpen` reset effect and the Cmd+Enter handler with the paste box — splitting would fragment both.

### 5. `app/components/UploadModal/` — the fix pane

Two new render-only subcomponents, per the `CellEditor.tsx` / `SortArrows.tsx` precedent. Neither gets its own `hooks.ts`; both take everything as props.

```
app/components/UploadModal/
├── UploadModal.tsx      # render only; branches on modal.isFixingJson
├── JsonFixPane.tsx      # NEW — the editor + actions
├── ParseErrorPanel.tsx  # NEW — the error list, now shared by both modes
├── hooks.ts             # + fix-pane state, + formatParseError
└── index.ts             # unchanged
```

`ParseErrorPanel.tsx` is extracted because both modes render it, and AGENTS.md §1.3 requires styled definitions to live in the file of the component they style — a shared `styled.div` export would break that rule, a shared component satisfies it. Props `{ errors: ParseError[]; id?: string }`; keeps `role="alert"`, the `"N issues found."` heading and the scrollable list, with items now going through `formatParseError`.

`UploadModal.tsx` gains three props (`jsonFix: JsonFixState | null`, `onJsonFixSubmit: (text: string) => void`, `onExitJsonFix: () => void`) and one top-level branch. In fix mode the `DropZone`, `Divider` and `PasteSection` are **replaced** — the ticket says the modal *switches* state, and two competing textareas would make the Cmd+Enter target ambiguous. Header, error panel and backdrop behaviour are shared.

Fix-mode markup:
- `Title` becomes `Fix your JSON` — the dialog is `aria-labelledby="upload-modal-title"`, so its accessible name updates for free.
- One instruction line: `This JSON can't be converted to CSV. Fix it below and convert again.`
- The editor reuses `PasteArea`'s styling (`ui-monospace`, `var(--grid-cell-bg)`, `resize: vertical`) at `rows={14}`, with `id="json-fix-editor"`, `aria-label="Edit JSON content"`, `aria-invalid="true"`, `aria-describedby="json-fix-errors"`, `spellCheck={false}`.
- `<ParseErrorPanel errors={errors} id="json-fix-errors" />` directly below, so the description the editor points at is the live error list.
- Actions: `Convert again` (primary, disabled on a blank draft) and `Choose a different file` (secondary → `onExitJsonFix`). `Start with a blank sheet` is hidden in fix mode — it would silently discard the user's JSON.

**Size guard.** Above `MAX_FIX_PANE_BYTES = 5 MB`, `useCsvViewer` leaves `jsonFix` at `null` and the modal shows only the error panel plus `This file is too large to edit here — fix it in your editor and upload again.` Rationale under Risks.

### 6. Copy and `accept` — `app/components/UploadModal/UploadModal.tsx`

| Line | Was | Becomes |
|---|---|---|
| 55 | `Drag a .csv file anywhere in this area` | `Drag a .csv or .json file anywhere in this area` |
| 60 | `Accepts: .csv files only` | `Accepts: .csv and .json files` |
| 65 | `accept=".csv"` | `accept={UPLOAD_ACCEPT_ATTRIBUTE}` |
| 67 | `aria-label="Choose a .csv file"` | `aria-label="Choose a .csv or .json file"` |
| 74 | `— or paste CSV below —` | **unchanged** — reinforces that paste is CSV-only |

### 7. Design tokens — fixing the §1.3 violations in the touched code

In scope, because these are the components being restructured:

- `RejectionMessage`'s `color: #dc2626` → `var(--error)`. The token already exists at `app/globals.css:16` as `light-dark(#dc2626, #ef4444)` and has no consumer yet; its light value is an exact match.
- `ErrorPanel`'s `border: 1px solid #fca5a5`, `background: rgba(220, 38, 38, 0.08)`, `color: #b91c1c` have no tokens. Add three to `app/globals.css`:
  ```css
  --error-foreground: light-dark(#b91c1c, #fca5a5);
  --error-border: light-dark(#fca5a5, #7f1d1d);
  --error-bg: light-dark(rgba(220, 38, 38, 0.08), rgba(239, 68, 68, 0.12));
  ```
  This is a real bug fix, not scope creep: the current values are light-mode-only, so `#b91c1c` on `#0a0a0a` makes the error list close to unreadable in dark mode today — and this ticket makes that list far more prominent.

Explicitly **out** of scope, recorded so the decision isn't lost: `CloseButton`'s `#e11d48`/`#be123c` (→ `--danger`/`--danger-hover`), `DropZone`'s `#60a5fa`, the buttons' `#ffffff`, `StartBlankButton`'s `rgba(0,112,243,0.08)`. Worth a separate cleanup ticket.

### 8. Analytics — `lib/analytics.ts`

Two events in house style (Title Case, past-tense verb; camelCase properties), both fired from the single `ingest` funnel:

- `track("Sheet Uploaded", { format, source, rowCount, columnCount })` — `format: "csv" | "json"`, `source: "file" | "paste" | "jsonFix"`. The app tracks `Sheet Downloaded` but has **no upload event at all** today; this closes that gap for CSV too.
- `track("Upload Rejected", { format, source, errorCount })` — the number that says whether the fix pane earns its keep.

`source: "jsonFix"` covers the fix-pane funnel, so no third event is needed. **Never send the JSON text, the filename, or any error message** — messages embed user key names like `$[0].address`. Counts only.

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

- **`__tests__/components/UploadModal/JsonFixPane.test.tsx`** — deep-import the component file, role/label-first queries, `fireEvent`. Editor has `aria-label="Edit JSON content"`, `aria-invalid="true"` and an `aria-describedby` matching the panel's `id`; `Convert again` disabled on a blank draft and firing the callback otherwise; `Choose a different file` fires the exit callback; the editor holds focus on mount.

**Updated:**

- **`__tests__/components/UploadModal/UploadModal.test.tsx`** — the `.csv`-only assertions at lines 23, 26, 40-43 become the new copy and `accept=".csv,.json"`. New: with `jsonFix={null}` the drop zone and paste area render and no editor does; with `jsonFix` set the dialog's accessible name is `Fix your JSON`, the editor is prefilled, and drop zone / paste area / `Start with a blank sheet` are absent; a `{ line: 0 }` error renders bare with no `Line 0:` prefix; `role="alert"` holds in both modes.
- **`__tests__/components/UploadModal/hooks.test.ts`** — the `"Only .csv files are accepted"` assertions at lines 130, 153, 367 become the new copy. New: `.json` accepted on drop and via `handleFileInputChange`; `.xlsx` rejected; `isFixingJson` tracks `jsonFix`; draft seeds from `jsonFix.source`; draft **survives** a failed retry with the same `source`; draft **reseeds** when `source` changes; `isOpen → false` clears it; `submitJsonFix` no-ops on a blank draft; **Escape in fix mode calls `onExitJsonFix`, not `onClose`; Escape outside fix mode still closes**; Cmd/Ctrl+Enter with the JSON editor focused calls `onJsonFixSubmit`, not `onPasteSubmit`. Plus `describe("formatParseError")` for both branches. Reuse the existing `makeArgs` / `makeDragEvent` / `makeChangeEvent` factories and the `KeyboardShortcutsProvider` wrapper.
- **`__tests__/components/CsvViewer/hooks.test.ts`** — extend the existing `mockFileReaderWithText` / `mockPendingFileReader` helpers near the top of the file with JSON payloads; `waitFor` already covers `runAfterPaint` (see the `handlePasteSubmit` describe at line 402). New: valid `.json` → `csvData[0]` is the header row, `firstRowAsHeader === true`, `fileName === "data.json"` (not rewritten), `LS_KEY_FILE_NAME === "data.json"`, modal closed; malformed `.json` → errors set, `csvData` null, modal open, `jsonFix === { source: <raw text>, fileName: "bad.json" }`; shape-incompatible `[[1,2]]` → message contains `$[0]`; `.json` containing `[]` → `No data found` **and** `jsonFix` set; `handleJsonFixSubmit` with corrected text loads the sheet, clears `jsonFix`, keeps the filename; a still-failing retry updates `jsonFix.source`; `exitJsonFix` clears both; `openUpload`/`closeUpload`/`handleClear`/`handleStartBlank` each clear `jsonFix`; the stale-parse guard holds for the JSON path via `mockPendingFileReader`. **Plus a regression guard: with `firstRowAsHeader` already on, a CSV upload leaves it on** — the CSV path must not start touching the toggle. No existing case in this file needs changing. Analytics assertions come free (`jest.mock("@/lib/analytics", …)` is already at line 16): assert `Sheet Uploaded` with `{ format: "json", source: "file" }` and `Upload Rejected` with `{ format: "json", errorCount: 1 }`.

---

## Verification

1. `npm test` — full suite green (CI runs `npm test -- --coverage`).
2. `npx tsc --noEmit` and `npm run lint`.
3. `npm run dev`, then in the browser, in **both light and dark themes** (error-panel readability is part of this ticket):
   - **Happy path** — save as `people.json` and drop it on the modal:
     ```json
     [{"id":1,"name":"Ann","active":true,"score":9.5,"note":null},
      {"id":2,"name":"Bob","active":false,"score":7}]
     ```
     Expect: modal closes; header `id, name, active, score, note`; **"First row as header" already on**; Ann's `note` empty; `active` reads lower-case `true`/`false`; Bob's `note` empty (missing key). Reload and confirm the sheet and the toggle survive.
   - **Malformed JSON** — `[{"a":1},{"b":2,,}]`. Expect the modal to become **Fix your JSON**, editor prefilled, error roughly `Line 1: Invalid JSON: Expected double-quoted property name` with no trailing `at position …`.
   - **Not JSON at all** — a file containing `hello world`. Expect a bare `Invalid JSON: Unexpected token 'h'…` with **no `Line 0:` prefix**.
   - **Bare object** — `{"a":1}` → the `Wrap it in [ ]` message. Edit in place to `[{"a":1}]`, hit **Convert again**, confirm it loads.
   - **Array of arrays** — `[[1,2],[3,4]]` → `$[0]: expected an object, but found an array…`.
   - **Array of primitives** — `[1,2,3]` → `$[0]: expected an object, but found a number.`
   - **Nested value** — `[{"a":1,"address":{"city":"X"}},{"a":2,"tags":["x"]}]` → **two** errors, `$[0].address` then `$[1].tags`, in that order.
   - **Empty array** — `[]` → `No data found` **and** the fix pane opens (not a dead end).
   - **Round trip** — load a CSV with the header toggle on, `Download as JSON`, upload that file back. Expect an identical sheet.
   - **Fix-pane lifecycle** — type into the editor, press **Convert again** on still-bad JSON, confirm your edits survive. Press **Escape** → returns to the drop zone; **Escape** again → closes. Press **Choose a different file** → drop zone returns with no errors. Re-open the modal after a failure → opens clean.
   - **Cmd/Ctrl+Enter** inside the editor converts; the same chord inside the CSV paste box still submits the paste.
   - **Regression** — CSV upload, CSV paste, `.xlsx` rejection copy (`Only .csv and .json files are accepted`), backdrop-click-to-close. **And the toggle: turn "First row as header" on, upload a CSV, confirm it is still on** — the CSV path must behave exactly as it does today.

---

## Risks

- **Main-thread blocking on large JSON.** `JSON.parse` is synchronous, and the shape walk plus row build are two further full passes — three where `parseCSV` does roughly one. `LoadingOverlay` already covers it (`handleFilePicked` sets `isParsing` before the async `FileReader`; `handleJsonFixSubmit` reuses `runAfterPaint`), so it is the same risk class the app already accepts for CSV, with a larger constant. No Web Worker here — that is its own ticket, for both parsers.
- **Memory, the sharper risk.** A JSON array expands to an object graph several times its text size, alive at the same time as the `string[][]` being built. A *failed* parse additionally pins the raw text in React state (`jsonFix.source`) **and** in the textarea's DOM value — roughly 4× the file size in UTF-16. That is what `MAX_FIX_PANE_BYTES` exists for.
- **Number precision is silently lossy** above 2^53, inside `JSON.parse` before our code runs. Documented and locked by a test.
- **`null` and `""` become indistinguishable**, so `null` does not survive a round trip back to JSON.
- **`localStorage` quota.** A large import makes the persist effect throw `QuotaExceededError`, already swallowed at `CsvViewer/hooks.ts:277-281` — the sheet works but silently stops persisting. Pre-existing, but easier to hit with JSON.
- **Engine-dependent syntax messages.** Mitigated structurally: line extraction is a pure function taking the message as an argument, tested against all three engines' literal strings, with `line: 0` as the always-safe fallback.

---

## Critical files

- `lib/jsonImporter.ts` — new; mirror of `lib/jsonExporter.ts`
- `lib/uploadFormats.ts` — new; `detectUploadFormat`, `UPLOAD_ACCEPT_ATTRIBUTE`
- `app/components/CsvViewer/hooks.ts` — `ingest` refactor, `jsonFix` state, `handleJsonFixSubmit`
- `app/components/UploadModal/hooks.ts` — file-type gate, draft state, two-stage Escape, Cmd+Enter dispatch, `formatParseError`
- `app/components/UploadModal/UploadModal.tsx` — mode branch, copy, `accept`; plus new `JsonFixPane.tsx` and `ParseErrorPanel.tsx` beside it
- `app/globals.css` — three new error tokens
