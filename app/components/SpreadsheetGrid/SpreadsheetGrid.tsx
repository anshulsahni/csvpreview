"use client";

import { styled } from "@linaria/react";
import FilterDropdown from "../FilterDropdown";
import { useSpreadsheetGrid } from "./hooks";
import { SortArrows } from "./SortArrows";

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
              {Array.from({ length: vm.numCols }, (_, ci) => {
                const isSortCol = vm.sort?.colIdx === ci;
                const isFilterActive = vm.filters[ci] !== undefined;
                const activeDir =
                  vm.sort && vm.sort.colIdx === ci
                    ? vm.sort.direction
                    : null;
                return (
                  <ColTh
                    key={ci}
                    sortActive={isSortCol}
                    aria-sort={
                      isSortCol
                        ? activeDir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    <ColThInner>
                      <span>{vm.colLabel(ci)}</span>
                      <SortArrows
                        activeDirection={activeDir}
                        onArrowClick={(dir) =>
                          vm.onSortArrowClick(ci, dir)
                        }
                      />
                      <FilterFunnelButton
                        type="button"
                        data-active={isFilterActive ? "true" : undefined}
                        aria-label={`Filter column ${vm.colLabel(ci)}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          vm.openDropdown(ci);
                        }}
                      >
                        <FilterGlyph />
                      </FilterFunnelButton>
                    </ColThInner>
                    {vm.openColIdx === ci && (
                      <FilterDropdown
                        title={vm.columnDisplayName(ci)}
                        columnType={vm.columnTypeFor(ci)}
                        uniqueValues={vm.uniqueValuesFor(ci)}
                        currentFilter={vm.filters[ci] ?? null}
                        onApply={(filter) => {
                          vm.setFilter(ci, filter);
                          vm.closeDropdown();
                        }}
                        onClear={() => {
                          vm.setFilter(ci, null);
                          vm.closeDropdown();
                        }}
                        onClose={vm.closeDropdown}
                      />
                    )}
                  </ColTh>
                );
              })}
            </tr>
            {vm.headerRowCells && (
              <tr data-header-row>
                <HeaderRowGutterTh>H</HeaderRowGutterTh>
                {Array.from({ length: vm.numCols }, (_, ci) => (
                  <HeaderRowTh key={ci}>
                    {vm.headerRowCells?.[ci] ?? ""}
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

const ColTh = styled.th<{ sortActive?: boolean }>`
  position: sticky;
  top: 0;
  z-index: 4;
  overflow: visible;
  min-width: 100px;
  width: 100px;
  height: var(--grid-col-header-height);
  box-sizing: border-box;
  text-align: center;
  font-weight: normal;
  background: ${({ sortActive }) =>
    sortActive
      ? "var(--grid-sort-active-bg)"
      : "var(--grid-header-bg)"};
  color: var(--grid-header-text);
  border: 1px solid var(--grid-border);
  padding: 2px 4px;
  user-select: none;
`;

const ColThInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
`;

const FilterFunnelButton = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  cursor: pointer;
  color: var(--grid-filter-icon-idle);
  line-height: 1;

  &[data-active="true"] {
    color: var(--grid-filter-icon-active);
  }

  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 1px;
  }
`;

const FilterGlyph = styled.span`
  position: relative;
  display: inline-block;
  width: 8px;
  height: 8px;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 6px solid currentColor;

  &::after {
    content: "";
    position: absolute;
    left: -1px;
    top: -2px;
    width: 2px;
    height: 4px;
    background: currentColor;
  }
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
