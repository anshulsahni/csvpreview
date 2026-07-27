export interface FocusCell {
  rowIdx: number;
  colIdx: number;
}

/**
 * A tiny per-grid external store for the currently focused cell.
 *
 * The focus indicator is a purely visual, DOM-positioned overlay — no cell in
 * the grid renders differently based on which cell is focused. Keeping the
 * focused cell in React state therefore forced a full re-render of every cell
 * (thousands of them) on each arrow-key move, for no visible change. Routing it
 * through an external store lets `FocusOverlay` subscribe on its own (via
 * `useSyncExternalStore`) and reposition itself, while the grid body stays put.
 */
export interface FocusCellStore {
  get: () => FocusCell | null;
  /** Server snapshot — the overlay is never rendered during SSR. */
  getServerSnapshot: () => FocusCell | null;
  set: (value: FocusCell | null) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createFocusCellStore(): FocusCellStore {
  let value: FocusCell | null = null;
  const listeners = new Set<() => void>();

  const sameCell = (a: FocusCell | null, b: FocusCell | null): boolean => {
    if (a === b) return true;
    if (a === null || b === null) return false;
    return a.rowIdx === b.rowIdx && a.colIdx === b.colIdx;
  };

  return {
    get: () => value,
    getServerSnapshot: () => null,
    set: (next) => {
      if (sameCell(value, next)) return;
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
