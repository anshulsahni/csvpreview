"use client";

import { styled } from "@linaria/react";

export interface DeleteSelectedControlProps {
  selectedRowCount: number;
  onDeleteSelected: () => void;
}

export default function DeleteSelectedControl({
  selectedRowCount,
  onDeleteSelected,
}: DeleteSelectedControlProps) {
  if (selectedRowCount === 0) return null;

  return (
    <DeleteButton type="button" onClick={onDeleteSelected}>
      Delete {selectedRowCount} {selectedRowCount === 1 ? "row" : "rows"}
    </DeleteButton>
  );
}

const DeleteButton = styled.button`
  background: transparent;
  color: #e11d48;
  border: 1px solid #e11d48;
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #e11d48;
    color: #ffffff;
  }
`;
