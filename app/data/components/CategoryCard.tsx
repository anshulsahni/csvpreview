import Link from "next/link";
import { styled } from "@linaria/react";
import {
  getCategoryPath,
  type CategoryMeta,
} from "@/lib/datasets/categories";

export interface CategoryCardProps {
  category: CategoryMeta;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const path = getCategoryPath(category.slug);

  return (
    <Card href={path}>
      <Header>
        <h3>{category.name}</h3>
        <SetCount>{category.datasetSlugs.length} SETS</SetCount>
      </Header>
      <Blurb>{category.blurb}</Blurb>
      <Chips>
        {category.datasetSlugs.slice(0, 3).map((slug) => (
          <Chip key={slug}>{slug}</Chip>
        ))}
      </Chips>
      <Footer>{path} →</Footer>
    </Card>
  );
}

const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  min-height: 210px;
  background: var(--surface);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-card);
  padding: var(--s-6);
  transition: box-shadow 0.15s;

  &:hover {
    box-shadow: var(--shadow-lift);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--s-3);
`;

const SetCount = styled.span`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 1px;
  color: var(--primary);
  white-space: nowrap;
`;

const Blurb = styled.p`
  font-size: var(--text-sm);
  margin-top: var(--s-2);
  margin-bottom: var(--s-4);
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  margin-top: auto;
`;

const Chip = styled.span`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  background: var(--surface-2);
  color: var(--fg);
  padding: var(--s-1) var(--s-3);
  border-radius: var(--r-pill);
`;

const Footer = styled.div`
  margin-top: var(--s-4);
  padding-top: var(--s-3);
  border-top: 1px solid var(--border);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary);
`;
