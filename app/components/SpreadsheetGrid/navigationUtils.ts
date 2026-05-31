export function clampCell(
  r: number,
  c: number,
  numRows: number,
  numCols: number
): { rowIdx: number; colIdx: number } {
  return {
    rowIdx: Math.max(0, Math.min(numRows - 1, r)),
    colIdx: Math.max(0, Math.min(numCols - 1, c)),
  };
}

function isCellEmpty(bodyRows: readonly string[][], rowIdx: number, colIdx: number): boolean {
  return (bodyRows[rowIdx]?.[colIdx] ?? "").trim() === "";
}

export function lastNonEmptyColInRow(
  bodyRows: readonly string[][],
  rowIdx: number,
  numCols: number
): number {
  for (let colIdx = numCols - 1; colIdx >= 0; colIdx--) {
    if (!isCellEmpty(bodyRows, rowIdx, colIdx)) return colIdx;
  }
  return 0;
}

/**
 * Excel-style Ctrl+Arrow: jump to the edge of the current data block, or to
 * the first non-empty cell in the given direction, or to the grid edge.
 *
 * rowDelta/colDelta: direction (-1, 0, or 1 for each axis).
 */
export function findDataBlockEdge(
  bodyRows: readonly string[][],
  rowIdx: number,
  colIdx: number,
  rowDelta: number,
  colDelta: number,
  numRows: number,
  numCols: number
): { rowIdx: number; colIdx: number } {
  const maxRow = numRows - 1;
  const maxCol = numCols - 1;

  const gridEdge = (): { rowIdx: number; colIdx: number } => ({
    rowIdx: rowDelta > 0 ? maxRow : rowDelta < 0 ? 0 : rowIdx,
    colIdx: colDelta > 0 ? maxCol : colDelta < 0 ? 0 : colIdx,
  });

  const currentEmpty = isCellEmpty(bodyRows, rowIdx, colIdx);
  const nextRow = rowIdx + rowDelta;
  const nextCol = colIdx + colDelta;
  const nextInBounds = nextRow >= 0 && nextRow <= maxRow && nextCol >= 0 && nextCol <= maxCol;

  if (!currentEmpty && nextInBounds && !isCellEmpty(bodyRows, nextRow, nextCol)) {
    // Both current and next are non-empty: advance to the last non-empty.
    let lastNonEmptyRow = rowIdx;
    let lastNonEmptyCol = colIdx;
    let scanRow = nextRow;
    let scanCol = nextCol;
    while (
      scanRow >= 0 && scanRow <= maxRow &&
      scanCol >= 0 && scanCol <= maxCol &&
      !isCellEmpty(bodyRows, scanRow, scanCol)
    ) {
      lastNonEmptyRow = scanRow;
      lastNonEmptyCol = scanCol;
      scanRow += rowDelta;
      scanCol += colDelta;
    }
    return { rowIdx: lastNonEmptyRow, colIdx: lastNonEmptyCol };
  }

  // Current is empty, or next is empty/out-of-bounds: advance to first non-empty.
  let scanRow = rowIdx + rowDelta;
  let scanCol = colIdx + colDelta;
  while (scanRow >= 0 && scanRow <= maxRow && scanCol >= 0 && scanCol <= maxCol) {
    if (!isCellEmpty(bodyRows, scanRow, scanCol)) {
      return { rowIdx: scanRow, colIdx: scanCol };
    }
    scanRow += rowDelta;
    scanCol += colDelta;
  }
  return gridEdge();
}
