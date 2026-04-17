# Plan: Task 2.1 — CSV Parser Library (`lib/csvParser.ts`)



## Context



The app currently has a naive CSV splitter in `CsvViewer.tsx` (`text.split("\n").map(row => row.split(","))`) that breaks on any real-world CSV with quoted fields, embedded delimiters, or escaped quotes. Task 2.1 replaces this with a proper parser.



**Key design requirement from the user:** Do NOT write a custom parser. Use the most popular/reliable open-source library and wrap it behind a stable API that never needs to change even if the underlying library is swapped.



**Chosen library: PapaParse** — the dominant browser CSV parser (~9M npm downloads/week, 13K+ GitHub stars, RFC 4180 compliant, 7.6 KB gzipped, zero dependencies, TypeScript types via `@types/papaparse`).



---



## Implementation Plan



### Step 1 — Install Dependencies



```bash

npm install papaparse

npm install --save-dev @types/papaparse

```



`papaparse` → `dependencies` (needed at runtime in the browser).

`@types/papaparse` → `devDependencies` (types only, stripped at build time).



---



### Step 2 — Create `lib/csvParser.ts`



**Stable public API surface (three exports — these NEVER change):**



```typescript

// All three delimiter values the app supports

export type Delimiter = "," | "|" | " ";



// Our error shape — maps from PapaParse's internal format

export interface ParseError {

  line: number;    // 1-indexed (PapaParse row is 0-indexed, we add +1)

  message: string; // human-readable, forwarded from PapaParse

}



// The function's return value — always present, never null/undefined

export interface ParseResult {

  rows: string[][];   // 2D array, all values as strings

  errors: ParseError[]; // empty on success

}



// Caller-facing config — optional fields so future additions are non-breaking

export interface ParseOptions {

  delimiter?: Delimiter; // defaults to ","

}



// The one exported function

export function parseCSV(input: string, options?: ParseOptions): ParseResult

```



**Internal structure of `lib/csvParser.ts`:**



```

Section 1 — Exported public types (no papaparse imports here)

Section 2 — Single import: import Papa from "papaparse"

Section 3 — Private mapping helpers (NOT exported):

  - mapPapaError(e: Papa.ParseError): ParseError  →  { line: e.row + 1, message: e.message }

  - mapPapaResult(r: Papa.ParseResult<string[]>): ParseResult  →  { rows: r.data, errors: r.errors.map(mapPapaError) }

Section 4 — Exported parseCSV function

```



**`parseCSV` logic:**



1. Resolve `delimiter` from options (default `","`)

2. **Early return guard:** if `input.trim() === ""`, return `{ rows: [], errors: [] }` — PapaParse returns a spurious `[[""]]` row on empty string; we prevent that

3. Call `Papa.parse<string[]>(input, { delimiter, quoteChar: '"', escapeChar: '"', skipEmptyLines: "greedy", header: false })`

   - `skipEmptyLines: "greedy"` → skips blank AND whitespace-only lines (hardcoded, not exposed to callers per spec)

   - `header: false` → always return raw `string[][]` (headers are a grid-layer concern, not a parser concern)

   - Synchronous — `Papa.parse` on a plain string is always sync (no `complete` callback needed)

4. Return `mapPapaResult(result)`



**Edge cases handled:**



| Input | Behavior |

|---|---|

| `""` or `"\n\n"` | Early return → `{ rows: [], errors: [] }` |

| Mixed blank + content lines | `skipEmptyLines: "greedy"` strips them |

| Unclosed quote | PapaParse emits `MissingQuotes` error → mapped to `{ line, message }` |

| `"field with ""quotes"""` | Decoded to `field with "quotes"` via RFC 4180 double-quote escaping |

| Delimiter inside quoted field | PapaParse handles correctly per RFC 4180 |

| Pipe or space delimiter | PapaParse accepts any single char as `delimiter` |



---



### Step 3 — No changes to `CsvViewer.tsx` in this task



Task 2.2 (`UploadModal.tsx`) will consume `parseCSV`. The naive parser in `CsvViewer.tsx` stays until Task 2.2 replaces it. This keeps Task 2.1 strictly scoped to `lib/csvParser.ts`.



---



## Critical Files



| File | Action |

|---|---|

| `lib/csvParser.ts` | **CREATE** — the parser module |

| `__tests__/lib/csvParser.test.ts` | **CREATE** — unit tests |

| `package.json` | **MODIFY** — add `papaparse` (dep) + `@types/papaparse` (devDep) |

| `lib/analytics.ts` | Reference for existing lib wrapper pattern (convention to follow) |

| `app/components/CsvViewer.tsx` | Read-only reference — shows how `string[][]` is used by the grid |



---



## Stable API Contract (future-proofing)



The API is designed so swapping PapaParse for another library (e.g., `csv-parse`, `fast-csv`) only requires rewriting Sections 2–3 inside `csvParser.ts`. No caller changes:



- All exported types are our types — zero PapaParse types leak into exports

- `import Papa from "papaparse"` is the only reference to PapaParse in the entire codebase

- `mapPapaError` / `mapPapaResult` are private helpers (not exported)

- `ParseOptions` uses optional fields — adding `maxRows?: number` etc. is non-breaking



**How future tasks consume the parser:**



```typescript

// UploadModal (Task 2.2) — primary consumer

import { parseCSV, type ParseResult, type Delimiter } from "@/lib/csvParser";

const result = parseCSV(rawText, { delimiter });

// result.errors → red error panel in wireframe 1A

// result.rows → passed to SpreadsheetGrid



// csvExporter (Task 9.1) — shares the Delimiter type only

import type { Delimiter } from "@/lib/csvParser";



// Toolbar (Task 10.1) — delimiter re-parse on dropdown change

parseCSV(storedRawCsv, { delimiter: newDelimiter });

```



---



## Unit Tests



**File:** `__tests__/lib/csvParser.test.ts`



`parseCSV` is a pure function with no DOM/React dependencies — no `@testing-library` imports needed. Standard Jest `describe/it/expect` only.



```typescript

import { parseCSV } from "@/lib/csvParser";



describe("parseCSV", () => {

  describe("empty / blank input", () => {

    it("returns empty rows and no errors for empty string", () => {

      expect(parseCSV("")).toEqual({ rows: [], errors: [] });

    });



    it("returns empty rows for whitespace-only input", () => {

      expect(parseCSV("   ")).toEqual({ rows: [], errors: [] });

    });



    it("returns empty rows for newlines-only input", () => {

      expect(parseCSV("\n\n\n")).toEqual({ rows: [], errors: [] });

    });

  });



  describe("basic comma-delimited parsing", () => {

    it("parses a single row", () => {

      expect(parseCSV("a,b,c").rows).toEqual([["a", "b", "c"]]);

    });



    it("parses multiple rows", () => {

      expect(parseCSV("a,b\nc,d").rows).toEqual([["a", "b"], ["c", "d"]]);

    });



    it("preserves numeric strings as strings (no coercion)", () => {

      expect(parseCSV("1,2.5,03").rows).toEqual([["1", "2.5", "03"]]);

    });



    it("preserves whitespace within cell values", () => {

      expect(parseCSV("hello world, foo ").rows).toEqual([["hello world", " foo "]]);

    });



    it("handles a trailing newline without adding an empty row", () => {

      expect(parseCSV("a,b\nc,d\n").rows).toEqual([["a", "b"], ["c", "d"]]);

    });



    it("uses comma as default delimiter when options is omitted", () => {

      expect(parseCSV("x,y").rows).toEqual([["x", "y"]]);

    });



    it("uses comma as default delimiter when options is empty object", () => {

      expect(parseCSV("x,y", {}).rows).toEqual([["x", "y"]]);

    });

  });



  describe("RFC 4180 quoted fields", () => {

    it("strips quotes from a quoted field", () => {

      expect(parseCSV('"hello"').rows).toEqual([["hello"]]);

    });



    it("preserves delimiter inside quoted field", () => {

      expect(parseCSV('"hello, world",foo').rows).toEqual([["hello, world", "foo"]]);

    });



    it("preserves a pipe inside a comma-quoted field", () => {

      expect(parseCSV('"a|b",c').rows).toEqual([["a|b", "c"]]);

    });



    it("handles mix of quoted and unquoted fields in same row", () => {

      expect(parseCSV('plain,"quoted",plain').rows).toEqual([["plain", "quoted", "plain"]]);

    });

  });



  describe("escaped quotes (RFC 4180 double-quote escaping)", () => {

    it('decodes "" inside a quoted field to a single "', () => {

      expect(parseCSV('"say ""hello"""').rows).toEqual([['say "hello"']]);

    });



    it("handles escaped quotes alongside regular content", () => {

      expect(parseCSV('"He said ""Hi"", she said ""Bye"""').rows).toEqual([

        ['He said "Hi", she said "Bye"'],

      ]);

    });

  });



  describe("pipe delimiter", () => {

    it("parses pipe-delimited single row", () => {

      expect(parseCSV("a|b|c", { delimiter: "|" }).rows).toEqual([["a", "b", "c"]]);

    });



    it("parses pipe-delimited multiple rows", () => {

      expect(parseCSV("a|b\nc|d", { delimiter: "|" }).rows).toEqual([["a", "b"], ["c", "d"]]);

    });



    it("treats comma as literal when pipe is the delimiter", () => {

      expect(parseCSV("a,b|c", { delimiter: "|" }).rows).toEqual([["a,b", "c"]]);

    });



    it("handles quoted fields with pipe delimiter", () => {

      expect(parseCSV('"a|b"|c', { delimiter: "|" }).rows).toEqual([["a|b", "c"]]);

    });

  });



  describe("space delimiter", () => {

    it("parses space-delimited single row", () => {

      expect(parseCSV("a b c", { delimiter: " " }).rows).toEqual([["a", "b", "c"]]);

    });



    it("treats comma as literal when space is the delimiter", () => {

      expect(parseCSV("a,b c", { delimiter: " " }).rows).toEqual([["a,b", "c"]]);

    });

  });



  describe("blank line handling", () => {

    it("skips blank lines between data rows", () => {

      expect(parseCSV("a,b\n\nc,d").rows).toEqual([["a", "b"], ["c", "d"]]);

    });



    it("skips multiple consecutive blank lines", () => {

      expect(parseCSV("a,b\n\n\n\nc,d").rows).toEqual([["a", "b"], ["c", "d"]]);

    });



    it("skips whitespace-only lines (greedy mode)", () => {

      expect(parseCSV("a,b\n   \nc,d").rows).toEqual([["a", "b"], ["c", "d"]]);

    });



    it("skips blank lines at the start", () => {

      expect(parseCSV("\n\na,b").rows).toEqual([["a", "b"]]);

    });

  });



  describe("multiline quoted fields", () => {

    it("preserves embedded newline inside a quoted field", () => {

      const input = 'a,"line1\nline2",b';

      expect(parseCSV(input).rows).toEqual([["a", "line1\nline2", "b"]]);

    });



    it("counts as a single row despite embedded newlines", () => {

      const input = '"first\nsecond\nthird"';

      expect(parseCSV(input).rows).toHaveLength(1);

      expect(parseCSV(input).rows[0]).toHaveLength(1);

    });

  });



  describe("error reporting", () => {

    it("returns no errors for valid input", () => {

      expect(parseCSV("a,b\nc,d").errors).toEqual([]);

    });



    it("returns an error with a 1-indexed line number for unclosed quote", () => {

      const result = parseCSV('"unclosed');

      expect(result.errors.length).toBeGreaterThan(0);

      expect(result.errors[0].line).toBe(1);

      expect(typeof result.errors[0].message).toBe("string");

      expect(result.errors[0].message.length).toBeGreaterThan(0);

    });



    it("reports error on correct line when error is not on line 1", () => {

      const input = 'a,b\nc,d\n"unclosed';

      const result = parseCSV(input);

      expect(result.errors[0].line).toBe(3);

    });



    it("still returns partial rows alongside errors (graceful recovery)", () => {

      const result = parseCSV('a,b\n"unclosed');

      expect(result.rows.length).toBeGreaterThan(0);

      expect(result.errors.length).toBeGreaterThan(0);

    });



    it("error message is a non-empty string", () => {

      const result = parseCSV('"bad');

      expect(result.errors[0].message).toBeTruthy();

    });

  });



  describe("return type contract", () => {

    it("always returns rows as an array (never null or undefined)", () => {

      expect(Array.isArray(parseCSV("").rows)).toBe(true);

      expect(Array.isArray(parseCSV("a,b").rows)).toBe(true);

      expect(Array.isArray(parseCSV('"bad').rows)).toBe(true);

    });



    it("always returns errors as an array (never null or undefined)", () => {

      expect(Array.isArray(parseCSV("").errors)).toBe(true);

      expect(Array.isArray(parseCSV("a,b").errors)).toBe(true);

    });



    it("rows is string[][] — every cell is a string, not a number", () => {

      const result = parseCSV("1,2,3");

      expect(typeof result.rows[0][0]).toBe("string");

    });

  });

});

```



---



## Verification



1. **Type check:** `npx tsc --noEmit` — should pass with zero errors

2. **Unit tests:** `npm test -- __tests__/lib/csvParser.test.ts` — all 10 describe blocks should pass

3. **Build check:** `npm run build` — should succeed (PapaParse has browser-compatible exports)

