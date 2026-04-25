"use client";

import { useMemo, useState } from "react";
import type { ColumnFilter, NumericOperator } from "@/lib/filterUtils";

export interface UseFilterDropdownArgs {
  columnType: "numeric" | "text";
  uniqueValues: string[];
  currentFilter: ColumnFilter | null;
  onApply: (filter: ColumnFilter | null) => void;
  onClear: () => void;
}

export interface FilterDropdownViewModel {
  columnType: "numeric" | "text";
  searchQuery: string;
  showSearch: boolean;
  visibleValues: string[];
  selectedValues: Set<string>;
  numericOperator: NumericOperator;
  numericValue: string;
  isApplyDisabled: boolean;
  setSearchQuery: (value: string) => void;
  toggleValue: (value: string) => void;
  selectAll: () => void;
  clearAll: () => void;
  setNumericOperator: (op: NumericOperator) => void;
  setNumericValue: (value: string) => void;
  apply: () => void;
  clearFilter: () => void;
}

function areSetsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
}

export function computeFilterDropdownViewModel(
  columnType: "numeric" | "text",
  uniqueValues: string[],
  searchQuery: string,
  numericValue: string
): Pick<
  FilterDropdownViewModel,
  "showSearch" | "visibleValues" | "isApplyDisabled"
> {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleValues =
    normalizedQuery === ""
      ? uniqueValues
      : uniqueValues.filter((value) =>
          value.toLowerCase().includes(normalizedQuery)
        );

  const numericParsed = Number(numericValue);
  const numericInvalid =
    numericValue.trim() === "" || !Number.isFinite(numericParsed);

  return {
    showSearch: uniqueValues.length >= 5,
    visibleValues,
    isApplyDisabled: columnType === "numeric" ? numericInvalid : false,
  };
}

export function useFilterDropdown({
  columnType,
  uniqueValues,
  currentFilter,
  onApply,
  onClear,
}: UseFilterDropdownArgs): FilterDropdownViewModel {
  const allValuesSet = useMemo(() => new Set(uniqueValues), [uniqueValues]);
  const initialSelectedValues =
    columnType === "text" && currentFilter?.kind === "set"
      ? new Set(currentFilter.values)
      : new Set(uniqueValues);
  const initialNumericOperator =
    columnType === "numeric" && currentFilter?.kind === "numeric"
      ? currentFilter.op
      : "=";
  const initialNumericValue =
    columnType === "numeric" && currentFilter?.kind === "numeric"
      ? String(currentFilter.value)
      : "";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedValues, setSelectedValues] = useState<Set<string>>(initialSelectedValues);
  const [numericOperator, setNumericOperator] = useState<NumericOperator>(initialNumericOperator);
  const [numericValue, setNumericValue] = useState(initialNumericValue);

  const computed = useMemo(
    () =>
      computeFilterDropdownViewModel(
        columnType,
        uniqueValues,
        searchQuery,
        numericValue
      ),
    [
      columnType,
      uniqueValues,
      searchQuery,
      numericValue,
    ]
  );

  const toggleValue = (value: string) => {
    setSelectedValues((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedValues(new Set(uniqueValues));
  };

  const clearAll = () => {
    setSelectedValues(new Set());
  };

  const clearFilter = () => {
    if (columnType === "text") {
      setSelectedValues(new Set(uniqueValues));
    } else {
      setNumericOperator("=");
      setNumericValue("");
    }
    onClear();
  };

  const apply = () => {
    if (columnType === "text") {
      if (areSetsEqual(selectedValues, allValuesSet)) {
        onApply(null);
        return;
      }
      onApply({ kind: "set", values: new Set(selectedValues) });
      return;
    }

    const parsed = Number(numericValue);
    if (!Number.isFinite(parsed)) return;
    onApply({ kind: "numeric", op: numericOperator, value: parsed });
  };

  return {
    columnType,
    searchQuery,
    showSearch: computed.showSearch,
    visibleValues: computed.visibleValues,
    selectedValues,
    numericOperator,
    numericValue,
    isApplyDisabled: computed.isApplyDisabled,
    setSearchQuery,
    toggleValue,
    selectAll,
    clearAll,
    setNumericOperator,
    setNumericValue,
    apply,
    clearFilter,
  };
}
