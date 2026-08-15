import Link from "next/link";
import { styled } from "@linaria/react";
import type { DatasetMeta } from "@/lib/datasets/types";
import { getDatasetPath } from "@/lib/datasets/categories";

export interface DatasetListItemProps {
  dataset: DatasetMeta;
  categorySlug: string;
}

export default function DatasetListItem({
  dataset,
  categorySlug,
}: DatasetListItemProps) {
  // One path for both the link and the visible text, so they can't drift.
  const path = getDatasetPath(categorySlug, dataset.slug);

  return (
    <Row href={path}>
      <div>
        <Title>{dataset.title}</Title>
        <Slug>{path}</Slug>
      </div>
      <Arrow aria-hidden="true">→</Arrow>
    </Row>
  );
}

const Row = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  padding: var(--s-4) var(--s-5);
  border-top: 1px solid var(--border);
  transition: background 0.15s;

  &:first-of-type {
    border-top: none;
  }

  &:hover {
    background: var(--surface-2);
  }
`;

const Title = styled.div`
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  color: var(--primary);
`;

const Slug = styled.div`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--fg-subtle);
  margin-top: 2px;
`;

const Arrow = styled.span`
  color: var(--primary);
  font-size: var(--text-lg);
  flex-shrink: 0;
`;
