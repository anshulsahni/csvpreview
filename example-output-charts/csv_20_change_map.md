# CSV-20 — change map

A review aid for the JSON-upload implementation. Read this first, then dip into
the files that matter to you. `NEW` = new file or block, `CHG` = changed line(s),
everything unmarked is untouched.

Total: **4 new files, 7 changed.** 353 lines of production code (2 new modules +
57 changed lines), the rest is tests.

---

## 1. The upload path, end to end

```
   user picks or drops a file
              │
              ▼
  ┌───────────────────────────────────────────┐
  │ UploadModal.tsx                           │
  │   accept=".csv,.json"              CHG    │   copy + accept only
  │   "Drag a .csv or .json file…"     CHG    │
  └───────────────────┬───────────────────────┘
                      │
                      ▼
  ┌───────────────────────────────────────────┐
  │ UploadModal/hooks.ts                      │
  │   validateAndSubmitFile()          CHG    │
  │     detectUploadFormat(name, mime)        │
  │        │                                  │
  │        ├─ null ──▶ "Only .csv and .json   │  ← rejected here,
  │        │            files are accepted"   │    never reaches the viewer
  │        └─ csv | json ──▶ onFilePicked     │
  └───────────────────┬───────────────────────┘
                      │
                      ▼
  ┌───────────────────────────────────────────┐
  │ CsvViewer/hooks.ts                        │
  │   handleFilePicked()               CHG    │   +1 line: detect the format.
  │     detectUploadFormat(…) ?? "csv"        │   FileReader, loading overlay
  │     ── FileReader ── unchanged ──         │   and the stale-parse guard
  └───────────────────┬───────────────────────┘   are all untouched.
                      │
                      ▼
  ┌───────────────────────────────────────────┐
  │   ingest(text, name, format)       CHG    │   gained a 3rd argument
  └──────────┬────────────────────┬───────────┘
             │ format="csv"       │ format="json"
             ▼                    ▼
      parseCSV(text)         parseJSON(text)              NEW
      (untouched)            lib/jsonImporter.ts
             │                    │
             └─────────┬──────────┘
                       │  both return the SAME shape:
                       │  { rows: string[][], errors: ParseError[] }
                       ▼
              ┌────────────────────┐
              │ errors.length > 0? │
              └────┬──────────┬────┘
                  yes         no
                   │           │
                   ▼           ▼
    ┌──────────────────────┐  ┌────────────────────────────────────┐
    │ setParseErrors(...)  │  │ setCsvData(rows)                   │
    │ modal STAYS OPEN     │  │ format="json" → firstRowAsHeader=on│ NEW
    │ nothing loads        │  │ format="csv"  → toggle NOT touched │ ← no regression
    │ prior sheet untouched│  │ setFileName("data.json")           │ ← extension kept
    └──────────┬───────────┘  │ modal closes                       │
               │              └────────────────────────────────────┘
               ▼
    ┌──────────────────────────────────┐
    │ ErrorPanel (existing component)  │
    │   formatParseError(error)   NEW  │  line > 0 → "Line 3: …"
    │                                  │  line = 0 → bare message
    │   colours → var(--error-*)  CHG  │  was light-mode-only hex
    └──────────────────────────────────┘
```

**The one thing to convince yourself of:** JSON reuses the CSV failure contract
exactly. Same `ParseResult` shape, same "modal stays open, nothing loads", same
error panel. No new UI, no new state, no new component.

---

## 2. Inside the new parser — `lib/jsonImporter.ts`

```
parseJSON(input)
   │
   ├─ blank, "[]", "[{},{}]" ──────▶ { rows: [], errors: [] }
   │                                  caller's existing "no rows" branch
   │                                  turns this into "No data found"
   │
   ├─ JSON.parse throws ───────────▶ describeSyntaxError(message, input)
   │                                    ├ "at position N" → count \n → line
   │                                    ├ "line N"        → use it        (Firefox)
   │                                    └ neither         → line 0        (Safari, some V8)
   │                                  1 error → STOP
   │
   ├─ collectShapeErrors(parsed) ──▶ not an array?       → "Top level must be…"
   │                                  element not object? → "$[2]: expected an object…"
   │                                  nested value?       → "$[0].address: nested objects…"
   │                                  (first 50, then "…and N more issues.")
   │                                  any errors → STOP
   │
   └─ deriveHeaderRow()   union of all keys, first-seen order
      jsonValueToCell()   per cell
              │
              ▼
      rows[0] = header, one row per record
```

### Conversion semantics at a glance

```
  INPUT                                        OUTPUT (rows[0] is the header)
  [                                            ┌────┬──────┬────────┬──────┐
    {"id":1,"name":"Ann","ok":true,"n":null},  │ id │ name │   ok   │  n   │
    {"id":2,"name":"Bob"}                      ├────┼──────┼────────┼──────┤
  ]                                            │ 1  │ Ann  │  true  │      │  null    → ""
                                               │ 2  │ Bob  │        │      │  missing → ""
                                               └────┴──────┴────────┴──────┘
                                               booleans stay lower case
                                               strings verbatim ("007" stays "007")
```

### What is rejected, and what the user is told

```
  {"id":1}          →  Top level must be an array of objects, but found a single
                       object. Wrap it in [ ] to convert one row.
  [[1,2],[3,4]]     →  $[0]: expected an object, but found an array. Arrays of
                       arrays are not supported.
  [1,2,3]           →  $[0]: expected an object, but found a number.
  [{"a":{"b":1}}]   →  $[0].a: nested objects are not supported — every value
                       must be a string, number, true, false or null.
  [{"a":1},         →  Line 1: Invalid JSON: Expected double-quoted property name
   {"b":2,,}]
  []                →  No data found
```

---

## 3. File-by-file: where to spend your review time

| File | Lines | What to look at |
|---|---|---|
| **`lib/jsonImporter.ts`** `NEW` | 271 | **The one file worth reading in full.** All the conversion and validation logic lives here. Pure, no imports except types. |
| **`lib/uploadFormats.ts`** `NEW` | 82 | Small. The only judgement call: **extension beats MIME type** (browsers report `.json` as `""` or `application/octet-stream` too often to trust). |
| `app/components/CsvViewer/hooks.ts` | +21 −4 | Three spots: the `format` argument on `ingest`, the parser branch, the `firstRowAsHeader` line. Everything around them is untouched. |
| `app/components/UploadModal/hooks.ts` | +23 −6 | `isCsvFile` deleted → `detectUploadFormat`; new `formatParseError`. No new state. |
| `app/components/UploadModal/UploadModal.tsx` | +13 −10 | Copy, `accept`, one render line, and hex → tokens. No structural change. |
| `app/globals.css` | +3 −0 | Three `--error-*` tokens. |
| `__tests__/lib/jsonImporter.test.ts` `NEW` | 356 | Where the behaviour is pinned. Skim the `describe` names to see the coverage. |
| `__tests__/lib/uploadFormats.test.ts` `NEW` | 61 | Extension/MIME precedence table. |
| `__tests__/components/**` | +249 −9 | Updated copy assertions + new JSON cases. |

---

## 4. Deliberately NOT touched

Useful for scoping the blast radius — if you expected a change here, it isn't one:

```
  ✗ lib/csvParser.ts            the CSV parser is byte-identical
  ✗ CsvViewer.tsx               no new props, no JSX change at all
  ✗ the paste textarea          still CSV-only, by decision
  ✗ Escape / Cmd+Enter / drag   unchanged
  ✗ handleStartBlank, handleClear, openUpload, closeUpload
                                unchanged — the feature added no new state to reset
  ✗ SpreadsheetGrid, download, filters, sorting
                                downstream of ingest, and ingest's output shape
                                (string[][]) did not change
```

---

## 5. Two decisions that are easy to miss in a diff

**`firstRowAsHeader` is set for JSON only.**
JSON keys *are* a header, so the toggle goes on or the grid would show `A/B/C`
with the key row sitting in the body as data row 1. The CSV branch never reaches
the setter, so existing CSV behaviour is unchanged. Verified in the browser:
after a JSON import turned it on, uploading a CSV left it on.

**The error panel's colours were a real bug, not tidying.**
They were light-mode-only hex. In dark mode the text was `#b91c1c` on `#0a0a0a`
— **2.78:1 contrast, failing WCAG AA**. Now `9.48:1`. It matters more than it
looks, because the panel is the *entire* failure experience for a bad JSON file.

---

## 6. Verification run

```
  npx jest          749 tests, 51 suites   all pass  (70 new)
  npx tsc --noEmit  clean
  npm run lint      0 errors  (4 pre-existing warnings, none in touched files)
  browser           happy path + 5 error classes + rejection + recovery
                    no console errors
```

Not covered end-to-end: the Download-as-JSON → re-upload round trip runs as a
unit test (`parseJSON(exportJSON(...))`) but was not driven through the browser's
download flow, which this ticket does not change.
