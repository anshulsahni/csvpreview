import { styled } from "@linaria/react";
import { computePillLabels } from "./hooks";

export interface CountPillsProps {
  /** Visible (post-filter) row count. Equal to `totalRowCount` when unfiltered. */
  rowCount: number;
  /** Total (unfiltered) row count. */
  totalRowCount: number;
  /** Number of columns in the data. */
  columnCount: number;
  /** Whether a filter is currently narrowing the visible rows. */
  hasActiveFilter: boolean;
}

export default function CountPills(props: CountPillsProps) {
  const { rowsLabel, columnsLabel } = computePillLabels(props);

  return (
    <Pills>
      <Pill title={rowsLabel} aria-label={rowsLabel}>
        {rowsLabel}
      </Pill>
      <Pill title={columnsLabel} aria-label={columnsLabel}>
        {columnsLabel}
      </Pill>
    </Pills>
  );
}

const Pills = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
`;

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  font-variant-numeric: tabular-nums;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  color: var(--foreground);
  background: var(--subtle);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.25rem 0.6rem;
`;
