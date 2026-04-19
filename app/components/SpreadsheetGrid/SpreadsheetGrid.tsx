"use client";

import { styled } from "@linaria/react";
import { useSpreadsheetGrid } from "./hooks";

export interface SpreadsheetGridProps {
  data: string[][];
  firstRowAsHeader?: boolean;
}

export default function SpreadsheetGrid({
  data,
  firstRowAsHeader = false,
}: SpreadsheetGridProps) {
  const vm = useSpreadsheetGrid({ data, firstRowAsHeader });

  return (
    <GridWrapper>
      <TableScroller>
        <table>
          <thead>
            <tr>
              <CornerTh />
              {Array.from({ length: vm.numCols }, (_, ci) => (
                <ColTh key={ci}>{vm.colLabel(ci)}</ColTh>
              ))}
            </tr>
            {vm.headerRowCells && (
              <tr data-header-row>
                <HeaderRowGutterTh>H</HeaderRowGutterTh>
                {Array.from({ length: vm.numCols }, (_, ci) => (
                  <HeaderRowTh key={ci}>
                    {(vm.headerRowCells ?? [])[ci] ?? ""}
                  </HeaderRowTh>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {Array.from({ length: vm.numRows }, (_, ri) => (
              <tr key={ri}>
                <RowTh>{vm.rowNumberOffset + ri}</RowTh>
                {Array.from({ length: vm.numCols }, (_, ci) => (
                  <DataTd key={ci}>
                    {vm.bodyRows[ri]?.[ci] ?? ""}
                  </DataTd>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroller>
      <StatusBar>{vm.statusHint}</StatusBar>
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
  z-index: 5;
  width: 40px;
  min-width: 40px;
  height: var(--grid-col-header-height);
  box-sizing: border-box;
  background: var(--grid-header-bg);
  border: 1px solid var(--grid-border);
`;

const ColTh = styled.th`
  position: sticky;
  top: 0;
  z-index: 4;
  min-width: 100px;
  width: 100px;
  height: var(--grid-col-header-height);
  box-sizing: border-box;
  text-align: center;
  font-weight: normal;
  background: var(--grid-header-bg);
  color: var(--grid-header-text);
  border: 1px solid var(--grid-border);
  padding: 3px 4px;
  user-select: none;
`;

const HeaderRowGutterTh = styled.th`
  position: sticky;
  top: var(--grid-col-header-height);
  left: 0;
  z-index: 3;
  width: 40px;
  min-width: 40px;
  box-sizing: border-box;
  text-align: center;
  font-weight: 600;
  background: var(--grid-header-row-bg);
  color: var(--grid-header-row-text);
  border: 1px solid var(--grid-border);
  padding: 3px 4px;
  user-select: none;
`;

const HeaderRowTh = styled.th`
  position: sticky;
  top: var(--grid-col-header-height);
  z-index: 2;
  min-width: 100px;
  width: 100px;
  box-sizing: border-box;
  text-align: center;
  font-weight: 600;
  background: var(--grid-header-row-bg);
  color: var(--grid-header-row-text);
  border: 1px solid var(--grid-border);
  padding: 3px 4px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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
