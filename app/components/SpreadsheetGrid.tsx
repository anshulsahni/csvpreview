"use client";

import { styled } from "@linaria/react";

interface SpreadsheetGridProps {
  data: string[][];
}

function colLabel(idx: number): string {
  let label = "";
  let i = idx + 1;
  while (i > 0) {
    label = String.fromCharCode(64 + ((i - 1) % 26) + 1) + label;
    i = Math.floor((i - 1) / 26);
  }
  return label;
}

const MIN_COLS = 26;
const MIN_ROWS = 50;

export default function SpreadsheetGrid({ data }: SpreadsheetGridProps) {
  const isEmpty = data.length === 0;
  const numCols = isEmpty
    ? MIN_COLS
    : Math.max(MIN_COLS, ...data.map((r) => r.length));
  const numRows = isEmpty ? MIN_ROWS : Math.max(MIN_ROWS, data.length);

  return (
    <GridWrapper>
      <TableScroller>
        <table>
          <thead>
            <tr>
              <CornerTh />
              {Array.from({ length: numCols }, (_, ci) => (
                <ColTh key={ci}>{colLabel(ci)}</ColTh>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: numRows }, (_, ri) => (
              <tr key={ri}>
                <RowTh>{ri + 1}</RowTh>
                {Array.from({ length: numCols }, (_, ci) => (
                  <DataTd key={ci}>{data[ri]?.[ci] ?? ""}</DataTd>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroller>
      <StatusBar>
        {isEmpty
          ? "Ready \u2014 upload a .csv, paste content, or start typing to create a new sheet"
          : "\u00a0"}
      </StatusBar>
    </GridWrapper>
  );
}

const GridWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  font-size: 13px;
  font-family: Arial, Helvetica, sans-serif;
`;

const TableScroller = styled.div`
  flex: 1;
  overflow: auto;
  position: relative;

  table {
    border-collapse: collapse;
    table-layout: fixed;
  }
`;

const CornerTh = styled.th`
  position: sticky;
  top: 0;
  left: 0;
  z-index: 3;
  width: 40px;
  min-width: 40px;
  background: var(--grid-header-bg);
  border: 1px solid var(--grid-border);
`;

const ColTh = styled.th`
  position: sticky;
  top: 0;
  z-index: 2;
  min-width: 100px;
  width: 100px;
  text-align: center;
  font-weight: normal;
  background: var(--grid-header-bg);
  color: var(--grid-header-text);
  border: 1px solid var(--grid-border);
  padding: 3px 4px;
  user-select: none;
`;

const RowTh = styled.th`
  position: sticky;
  left: 0;
  z-index: 1;
  width: 40px;
  min-width: 40px;
  text-align: center;
  font-weight: normal;
  background: var(--grid-header-bg);
  color: var(--grid-header-text);
  border: 1px solid var(--grid-border);
  padding: 3px 4px;
  user-select: none;
`;

const DataTd = styled.td`
  min-width: 100px;
  width: 100px;
  height: 25px;
  background: var(--grid-cell-bg);
  border: 1px solid var(--grid-border);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0 4px;
`;

const StatusBar = styled.div`
  height: 28px;
  border-top: 1px solid var(--grid-border);
  padding: 0 12px;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--grid-header-text);
  background: var(--grid-header-bg);
  flex-shrink: 0;
`;
