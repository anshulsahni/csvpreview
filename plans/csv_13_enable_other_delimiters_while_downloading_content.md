# CSV-13 — Download in other separators (TSV, pipe, space)

> On approval this file is saved to the repo as
> `plans/csv_13_support_for_other_delimiters_while_downloading.md`
> (matching the branch name and the `csv_11_download_json.md` convention).

## Context

[CSV-13](https://linear.app/csvpreview/issue/CSV-13) (Urgent · Feature · Todo) asks for the viewer to
export the sheet with separators other than a comma — **TSV**, **space-separated** and
**pipe-separated** — all reachable from the *existing* download split button's dropdown in the shape
CSV-11 established, with the download dialog showing the **correct, uneditable extension** for the
chosen format.

CSV-11 was explicitly built as CSV-13's extension point (`plans/csv_11_download_json.md`), so most of
the scaffolding already exists:

- `lib/downloadFormats.ts` — the format registry (`label` / `extension` / `mimeType`).
- `app/components/DownloadModal/` — already format-driven: title reads `Download <label>`, and the
  extension renders as a read-only chip beside a base-name-only input. **The ticket's extension
  requirement is already built**; new registry entries flow through it untouched.
- `app/components/Dropdown/` — the reusable dropdown the ticket's tech note asks for, with
  `DropdownItem`, `DropdownSeparator` and disabled styling. **No new component or extraction
  needed** ("only if required" per the ticket).

So the work is: widen the registry, generalise the one-off JSON menu entry into a format list, and
route the export through the chosen format's delimiter.

---

# Part 1 — Product & User Experience

## What the user gets

Five ways to save the sheet instead of one. The comma-separated `.csv` stays the one-click default;
the other four sit one level down in the dropdown that already exists next to it.

| Format | Extension | Separator | Gated? |
|---|---|---|---|
| CSV (primary button) | `.csv` | `,` | no |
| JSON | `.json` | — | needs a header row |
| TSV | `.tsv` | tab | no |
| Pipe-separated | `.psv` | `\|` | no |
| Space-separated | `.txt` | space | no |

`.txt` for space-separated because there is no established `.ssv` convention and `.txt` is what
other tools expect.

## The split button

Nothing about the button itself changes — the primary action and the caret are exactly as they are
today. Only the menu behind the caret grows.

```
  ┌──────────────────┬───┐
  │     Download     │ ▾ │   ← unchanged: primary = visible rows, as .csv
  └──────────────────┴───┘
                       │
                       ▼
  ┌──────────────────────────────┐
  │ Download all rows            │  ← scope section (existing)
  │ Download selected rows (2)   │     shown only when a filter or
  ├──────────────────────────────┤     selection makes them different
  │ Download as JSON             │  ← format section (new)
  │ Download as TSV              │     one entry per non-CSV format,
  │ Download as Pipe-separated   │     always present, fixed order
  │ Download as Space-separated  │
  └──────────────────────────────┘
```

A flat list, not a submenu: every format is one click away, and the shared `Dropdown` needs no new
capability.

When there is **no header row**, only the JSON entry dims — the three delimited formats never need
one:

```
  ┌──────────────────────────────┐
  │ Download as JSON             │ ░ dimmed, hover explains:
  │                              │   "Enable "First row as header" to download JSON"
  │ Download as TSV              │ ✓ enabled
  │ Download as Pipe-separated   │ ✓ enabled
  │ Download as Space-separated  │ ✓ enabled
  └──────────────────────────────┘
```

## The filename dialog

Already correct from CSV-11 — it simply reflects whichever format was picked. The extension is a
locked chip, so a file can never be saved with a separator/extension mismatch, which is exactly what
the ticket asks for:

```
   ┌─ Download TSV ──────────────────────── × ─┐
   │  Filename                                 │
   │  ┌──────────────────────────┬──────────┐  │
   │  │ csvpreview-export-…      │  .tsv    │  │  ← chip is read-only,
   │  └──────────────────────────┴──────────┘  │     announced via aria-describedby
   │                      [ Cancel ] [Download]│
   └───────────────────────────────────────────┘

   picked TSV   → title "Download TSV"              chip ".tsv"
   picked pipe  → title "Download Pipe-separated"   chip ".psv"
   picked space → title "Download Space-separated"  chip ".txt"
```

## Which rows come out

Scope and format stay two independent axes, and the menu is honest about which one each entry sets:

```
   scope entries  ──▶ change WHICH rows      (all / selected)   · always .csv
   format entries ──▶ change HOW they're written                · always the visible rows
```

Format entries export the **currently visible (filtered) rows** — the same rule CSV-11 set for JSON,
so all four non-primary formats behave alike.

## Behaviour worth knowing

A cell containing the active separator is quoted, as it is today for commas. For the **space**
format that means most prose cells come out quoted:

```
   space format:   id "New York" 8804190
```

Correct and round-trippable, but visibly different from the other formats — called out so it isn't
mistaken for a bug.

## Out of scope

Upload is untouched. A `.tsv` / `.psv` / `.txt` file re-uploaded today still parses as comma-or-JSON,
i.e. as a single column. Widening the import side is a separate ticket.

---

# Part 2 — Changes

## Where the change lands

```
  lib/csvParser.ts ─────────── Delimiter type gains tab
        │
        ▼
  lib/downloadFormats.ts ───── registry gains tsv / psv / ssv
        │                      each delimited spec now carries its separator
        │                      + an ordered list of "secondary" formats
        │
        ├──────────────▶ useDownloadControl.ts ── builds the menu's format entries
        │                        │
        │                        ▼
        │                 DownloadControl.tsx ── renders them in a loop
        │                        │
        │                        ▼
        │                 CsvViewer.tsx ──────── one prop renamed
        │
        └──────────────▶ CsvViewer/hooks.ts ──── picks the exporter + separator
                                                 from the format spec

  DownloadModal/*  ── UNCHANGED, already generic over the format
  Dropdown/*       ── UNCHANGED, already has item / separator / disabled
```

Adding a sixth format later should touch **one file**: the registry.

## 1. `lib/csvParser.ts` — widen the delimiter type

```
   Delimiter:   "," │ "|" │ " "        ──▶   "," │ "|" │ " " │ tab
```

**This is a type change only — no parser behaviour changes, and PapaParse is not on the download
path at all.** Export runs through `lib/csvExporter.ts`, a hand-written serializer with its own
quoting rules. The `Delimiter` type merely happens to live in `csvParser.ts`, and `csvExporter.ts`
imports it, so `exportCSV(rows, tab)` will not type-check until tab joins the union.

Additive and safe: `Delimiter` has only four consumers (`csvExporter.ts`, `CsvViewer/hooks.ts`) and
no exhaustive switch. On the parse side the widening is a no-op we get for free — PapaParse accepts
any explicit delimiter except `\r`, `\n`, `"` and the BOM (`papaparse.js:68,346`), and our wrapper
always passes one explicitly (`csvParser.ts:110`), so PapaParse's narrower auto-detection list —
`[',', tab, '|', ';', RECORD_SEP, UNIT_SEP]`, notably **without space** (`papaparse.js:1345`) — is
never reached.

> Alternative worth noting, not taken here: define the export separator type in
> `downloadFormats.ts` instead, which would decouple `csvExporter` from `csvParser` entirely. That
> is a wider refactor than CSV-13 needs — flagging it rather than doing it.

## 2. `lib/downloadFormats.ts` — the registry becomes the single source of truth

```
   DownloadFormat:  csv │ json          ──▶  csv │ json │ tsv │ psv │ ssv

   DownloadFormatSpec
     label      "TSV"                    → drives the dialog title AND the menu entry
     extension  ".tsv"                   → drives the locked chip + the saved filename
     mimeType   text/tab-separated-…     → drives the Blob
   + delimiter  <tab>                    → NEW. present ⇒ delimited text format
                                           absent  ⇒ JSON

   + SECONDARY_DOWNLOAD_FORMATS = [ json, tsv, psv, ssv ]
       the ordered list the dropdown renders — everything except the primary CSV
```

`ensureExtension` / `stripExtension` are untouched; they already work for any extension.

## 3. `app/components/CsvViewer/useDownloadControl.ts` — one JSON entry becomes a list

```
   BEFORE                                AFTER
   ──────                                ─────
   canDownloadJson ──▶ jsonDisabledReason   canDownloadJson
                                              │
   onDownloadJson()                           ▼
   handleJsonClick()                    computeDownloadFormatOptions(canDownloadJson)
                                              │  pure, exported for unit tests
                                              ▼
                                        [ { format, label, disabledReason? }, … ]
                                              │
                                        onDownloadFormat(format)
                                        handleFormatClick(option)
```

`handleFormatClick` keeps the existing guard semantics exactly: an entry with a `disabledReason`
returns early **without closing the menu**, so the `aria-disabled` item's tooltip stays reachable.
Menu open/close, Escape handling, blur-close, `computePrimaryDownloadLabel` and
`computeExtraDownloadOptions` are all unchanged.

## 4. `app/components/CsvViewer/DownloadControl.tsx` — render the list

```
   scope entries          (loop, unchanged)
   ── separator ──        (unchanged)
   ONE hard-coded         ──▶  loop over control.formatOptions
   "Download as JSON"          same aria-disabled + title pattern per entry
   item
```

Prop rename `onDownloadJson` → `onDownloadFormat`; `canDownloadJson` stays. No styling changes.

## 5. `app/components/CsvViewer/hooks.ts` — route the format's separator

```
   openDownloadJson()            ──▶  openDownloadFormat(format)
                                        reuses the existing openDownloadWith("visible", format)
                                        the three scope openers keep "csv"

   handleDownload:
     rows  ← scope (all │ selected │ visible)      ← unchanged
     text  ← spec.delimiter absent  ? exportJSON(header, rows)
                                    : exportCSV(header + rows, spec.delimiter)
     blob  ← spec.mimeType                          ← unchanged
     save  ← downloadBlob(blob, filename)           ← unchanged
     track ← "Sheet Downloaded" { format, scope }   ← unchanged, format widens on its own
```

A spec lookup rather than a `switch`, so no branch grows as formats are added. Note this makes the
export separator come from the **chosen format**, not the viewer's `delimiter` state — that state is
the *parse* delimiter and is hard-coded to `,` today. Decoupling them is correct now that the user
picks the output separator explicitly.

## 6. `app/components/CsvViewer/CsvViewer.tsx`

One prop rename on `<DownloadControl>`: `onDownloadJson` → `onDownloadFormat`, wired to the
generalised opener.

## 7. Deliberately unchanged

`DownloadModal.tsx` / `DownloadModal/hooks.ts` — already generic over the format. `ensureCsvExtension`
and `computeDefaultFilename` keep their `.csv` behaviour for their other consumer,
`app/tools/excel-to-csv/.../hooks.ts`, which acts as the regression guard.

---

## Tests

No new test files — every changed unit already has a home.

- `__tests__/lib/downloadFormats.test.ts` — every delimited format has a single-character separator
  and JSON has none; `SECONDARY_DOWNLOAD_FORMATS` covers every key except `csv`.
- `__tests__/components/CsvViewer/useDownloadControl.test.ts` — swap the two JSON-specific cases for
  `computeDownloadFormatOptions` (order, labels, JSON's reason present/absent) and
  `handleFormatClick` routing (fires with the right key and closes; a disabled click is ignored and
  leaves the menu open).
- `__tests__/components/CsvViewer/DownloadControl.test.tsx` — all four format items render beside the
  scope items; `Download as TSV` calls `onDownloadFormat("tsv")`; with no header row JSON is
  `aria-disabled` with its title while the delimited entries stay enabled.
- `__tests__/components/CsvViewer/hooks.test.ts` — `handleDownload` for `tsv` / `psv` / `ssv`
  asserting the Blob text uses the right separator and still prepends the header row (existing
  `jest.mock("@/lib/downloadFile")` pattern); JSON path unaffected.
- `__tests__/lib/csvExporter.test.ts` — a tab-delimiter case beside the existing `|` one, plus a cell
  containing a tab to cover the quoting rule.

## Verification

1. `npm test` (CI runs `npm test -- --coverage`), `npx tsc --noEmit`, `npm run lint`.
2. `npm run dev`, then in the viewer:
   - Load a CSV → open the dropdown → the flat menu matches the diagram above.
   - With **"First row as header" off**, only JSON dims and shows its tooltip.
   - **Download as TSV** → dialog titled `Download TSV`, `.tsv` chip locked; the saved file is
     tab-separated with the header row. Repeat for pipe (`.psv`) and space (`.txt`).
   - Confirm cells containing the active separator come out quoted.
   - Apply a filter → format entries export only the visible rows; `Download all rows` /
     `Download selected rows` still produce `.csv`.
   - Regression: the primary **Download** button still yields the identical comma-separated `.csv`.
