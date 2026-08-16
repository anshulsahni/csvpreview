/**
 * Pure helpers for per-row selection (a set of stable source body indices).
 *
 * Row identity here is the **source body index** — the index of a row within
 * the body rows before sort/filter — so a selection survives reordering and
 * filtering. These helpers are framework-agnostic and unit-tested directly.
 */

export type SelectAllState = "none" | "some" | "all";

/**
 * Return a new set with `id` toggled: added when absent, removed when present.
 * The input set is never mutated.
 */
export function toggleInSet(set: Set<number>, id: number): Set<number> {
  const next = new Set(set);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

/**
 * Given the currently selected ids and the body indices currently visible
 * (post filter), describe the select-all checkbox state:
 * - "all" when every visible row is selected (and there is at least one),
 * - "none" when no visible row is selected,
 * - "some" otherwise (indeterminate).
 */
export function computeSelectAllState(
  selectedIds: Set<number>,
  visibleBodyIndices: number[]
): SelectAllState {
  if (visibleBodyIndices.length === 0) return "none";
  let selectedCount = 0;
  for (const idx of visibleBodyIndices) {
    if (selectedIds.has(idx)) selectedCount += 1;
  }
  if (selectedCount === 0) return "none";
  if (selectedCount === visibleBodyIndices.length) return "all";
  return "some";
}

/**
 * Project the selected ids into display order using the display→source map, so
 * copy/download output matches what the user sees on screen. Only ids that are
 * actually part of the visible display are included.
 */
export function orderedSelectedBodyIndices(
  sourceRowIndexForDisplayRow: number[],
  selectedIds: Set<number>
): number[] {
  const ordered: number[] = [];
  for (const sourceIndex of sourceRowIndexForDisplayRow) {
    if (selectedIds.has(sourceIndex)) {
      ordered.push(sourceIndex);
    }
  }
  return ordered;
}

/**
 * Element-wise equality for two index lists. Used to suppress redundant
 * selection notifications, where re-emitting an equal-but-new array would cost
 * the consumer a render for no actual change.
 */
export function sameIndices(a: readonly number[], b: readonly number[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
