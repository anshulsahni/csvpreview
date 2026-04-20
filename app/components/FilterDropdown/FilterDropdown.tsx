"use client";

import { useEffect, useRef } from "react";
import { styled } from "@linaria/react";
import type { ColumnFilter } from "@/lib/filterUtils";
import { useFilterDropdown } from "./hooks";

export interface FilterDropdownProps {
  title: string;
  columnType: "numeric" | "text";
  uniqueValues: string[];
  currentFilter: ColumnFilter | null;
  onApply: (filter: ColumnFilter | null) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function FilterDropdown({
  title,
  columnType,
  uniqueValues,
  currentFilter,
  onApply,
  onClear,
  onClose,
}: FilterDropdownProps) {
  const vm = useFilterDropdown({
    columnType,
    uniqueValues,
    currentFilter,
    onApply,
    onClear,
  });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [onClose]);

  return (
    <DropdownRoot ref={rootRef} role="dialog" aria-label={`Filter ${title}`}>
      <DropdownTitle>Filter: {title}</DropdownTitle>

      {vm.columnType === "text" ? (
        <>
          {vm.showSearch && (
            <SearchInput
              type="text"
              value={vm.searchQuery}
              onChange={(event) => vm.setSearchQuery(event.target.value)}
              placeholder="Search values..."
              aria-label="Search filter values"
            />
          )}

          <QuickActionRow>
            <TextButton type="button" onClick={vm.selectAll}>
              Select all
            </TextButton>
            <TextButton type="button" onClick={vm.clearAll}>
              Clear all
            </TextButton>
          </QuickActionRow>

          <ValueList>
            {vm.visibleValues.map((value) => {
              const label = value === "" ? "(blank)" : value;
              return (
                <ValueRow key={value || "__blank__"}>
                  <label>
                    <input
                      type="checkbox"
                      checked={vm.selectedValues.has(value)}
                      onChange={() => vm.toggleValue(value)}
                    />
                    <span>{label}</span>
                  </label>
                </ValueRow>
              );
            })}
          </ValueList>
        </>
      ) : (
        <NumericControls>
          <OperatorSelect
            value={vm.numericOperator}
            onChange={(event) =>
              vm.setNumericOperator(event.target.value as typeof vm.numericOperator)
            }
            aria-label="Numeric operator"
          >
            <option value="=">=</option>
            <option value="!=">!=</option>
            <option value="<">&lt;</option>
            <option value="<=">&lt;=</option>
            <option value=">">&gt;</option>
            <option value=">=">&gt;=</option>
          </OperatorSelect>
          <NumericInput
            type="number"
            value={vm.numericValue}
            onChange={(event) => vm.setNumericValue(event.target.value)}
            aria-label="Numeric filter value"
            placeholder="Value"
          />
        </NumericControls>
      )}

      <FooterRow>
        <PrimaryButton
          type="button"
          onClick={vm.apply}
          disabled={vm.isApplyDisabled}
        >
          Apply Filter
        </PrimaryButton>
        <SecondaryButton
          type="button"
          onClick={vm.clearFilter}
        >
          Clear
        </SecondaryButton>
      </FooterRow>
    </DropdownRoot>
  );
}

const DropdownRoot = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 7;
  width: 220px;
  border: 1px solid var(--dropdown-border);
  border-radius: 8px;
  background: var(--dropdown-bg);
  box-shadow: var(--dropdown-shadow);
  padding: 10px;
  text-align: left;
`;

const DropdownTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const SearchInput = styled.input`
  width: 100%;
  border: 1px solid var(--dropdown-border);
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 13px;
  margin-bottom: 8px;
  background: var(--background);
  color: var(--foreground);
`;

const QuickActionRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const TextButton = styled.button`
  border: none;
  background: transparent;
  color: var(--primary);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
`;

const ValueList = styled.div`
  max-height: 220px;
  overflow: auto;
  border: 1px solid var(--dropdown-border);
  border-radius: 6px;
  padding: 4px 6px;
  margin-bottom: 10px;
`;

const ValueRow = styled.div`
  label {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 0;
    font-size: 13px;
    cursor: pointer;
  }
`;

const NumericControls = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
`;

const OperatorSelect = styled.select`
  width: 72px;
  border: 1px solid var(--dropdown-border);
  border-radius: 6px;
  padding: 6px;
  background: var(--background);
  color: var(--foreground);
`;

const NumericInput = styled.input`
  flex: 1;
  border: 1px solid var(--dropdown-border);
  border-radius: 6px;
  padding: 6px 8px;
  background: var(--background);
  color: var(--foreground);
`;

const FooterRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
`;

const PrimaryButton = styled.button`
  border: none;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  background: var(--primary);
  color: #ffffff;
  font-size: 13px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  border: 1px solid var(--dropdown-border);
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  background: transparent;
  color: var(--foreground);
  font-size: 13px;
`;
