---
name: Aggregation Status Bar
overview: Implement task 6.1 by deriving numeric aggregations from the existing task 5.1 selection state and appending the result to the existing grid status bar. Keep the change focused on `SpreadsheetGrid` view-model logic with tests for numeric, mixed, filtered/sorted, and empty selections.
todos:
  - id: add-aggregation-helpers
    content: Add pure helper functions in `SpreadsheetGrid/hooks.ts` to collect selected numeric values and compute count, sum, avg, min, and max.
    status: pending
  - id: compose-status
    content: Append the aggregation segment to `combinedStatusHint` using existing status separator conventions.
    status: pending
  - id: cover-hooks
    content: Add hook/helper unit tests for numeric, mixed, padded, and insufficient numeric selections.
    status: pending
  - id: cover-rendering
    content: Add component tests for visible aggregation status and hidden aggregation status.
    status: pending
  - id: verify
    content: Run focused SpreadsheetGrid tests and lint/full tests as appropriate.
    status: pending
isProject: false
---

# Aggregation Status Bar Plan

## Scope
- Task source: [`TASKS.md`](/Users/zeroansh/Works/anshulsahni/task_6.1/TASKS.md) defines 6.1 as showing Sum, Avg, Min, Max when 2+ numeric selected cells exist, skipping non-numeric cells and hiding aggregation when no numeric cells are selected.
- User story source: [`specs/v0.1/user_stories.md`](/Users/zeroansh/Works/anshulsahni/task_6.1/specs/v0.1/user_stories.md) maps this to Story 8, formulas on selected numerical data.
- Wireframe note: [`specs/v0.1/wireframes`](/Users/zeroansh/Works/anshulsahni/task_6.1/specs/v0.1/wireframes) did not contain discoverable files in this worktree, so the implementation will follow the task copy and existing status bar UI.

## Implementation Approach
- Add pure aggregation helpers near the existing selection helpers in [`app/components/SpreadsheetGrid/hooks.ts`](/Users/zeroansh/Works/anshulsahni/task_6.1/app/components/SpreadsheetGrid/hooks.ts), reusing `getSelectionBounds` and `parseFiniteNumber` from [`lib/sortUtils.ts`](/Users/zeroansh/Works/anshulsahni/task_6.1/lib/sortUtils.ts).
- Compute aggregations from `base.bodyRows`, so selected values match the visible grid after header toggle, sorting, and filtering.
- Ignore cells outside actual `bodyRows` and ignore non-numeric values, so padded empty spreadsheet rows do not distort the results.
- Append the aggregation copy to the existing `combinedStatusHint` pipeline after the current selection hint, preserving the existing single status bar rendered by [`app/components/SpreadsheetGrid/SpreadsheetGrid.tsx`](/Users/zeroansh/Works/anshulsahni/task_6.1/app/components/SpreadsheetGrid/SpreadsheetGrid.tsx).
- Use the requested copy shape: `N cells selected · Sum: X · Avg: Y · Min: Z · Max: W`. The existing selection segment already provides `N cells selected (A1:B2)`, so the aggregation segment should contain just `Sum/Avg/Min/Max` to avoid duplicate counts.
- Keep formatting simple and deterministic with a small number formatter, avoiding trailing `.0` while preserving decimals when present.

## Tests
- Extend [`__tests__/components/SpreadsheetGrid/hooks.test.ts`](/Users/zeroansh/Works/anshulsahni/task_6.1/__tests__/components/SpreadsheetGrid/hooks.test.ts) for pure aggregation helper behavior: reversed selections, mixed numeric/text cells, padded rows, and fewer than 2 numeric values.
- Extend [`__tests__/components/SpreadsheetGrid/SpreadsheetGrid.test.tsx`](/Users/zeroansh/Works/anshulsahni/task_6.1/__tests__/components/SpreadsheetGrid/SpreadsheetGrid.test.tsx) to verify the status bar shows aggregates after selecting numeric ranges and hides them for non-numeric selections.
- Run `npm test -- --runInBand __tests__/components/SpreadsheetGrid/hooks.test.ts __tests__/components/SpreadsheetGrid/SpreadsheetGrid.test.tsx`, then run `npm test` or `npm run lint` if the focused suite passes.