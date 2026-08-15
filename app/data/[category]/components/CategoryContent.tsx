import Link from "next/link";
import { styled } from "@linaria/react";
import {
  getCategoryPath,
  type CategoryMeta,
} from "@/lib/datasets/categories";
import type { DatasetMeta } from "@/lib/datasets/types";
import DatasetListItem from "./DatasetListItem";

export interface CategoryContentProps {
  category: CategoryMeta;
  datasets: DatasetMeta[];
  otherCategories: CategoryMeta[];
}

export default function CategoryContent({
  category,
  datasets,
  otherCategories,
}: CategoryContentProps) {
  return (
    <Wrapper>
      <Hero>
        <h1>{category.name} datasets</h1>
        <Lede>
          {category.blurb} {datasets.length} files, all previewable in the
          browser.
        </Lede>
      </Hero>
      <Layout>
        <List>
          {datasets.map((dataset) => (
            <DatasetListItem
              key={dataset.slug}
              dataset={dataset}
              categorySlug={category.slug}
            />
          ))}
        </List>
        <Rail>
          <RailCard>
            <RailLabel>Browse categories</RailLabel>
            {otherCategories.map((other) => (
              <RailRow key={other.slug} href={getCategoryPath(other.slug)}>
                <span>{other.name}</span>
                <RailCount>{other.datasetSlugs.length}</RailCount>
              </RailRow>
            ))}
            <RailAllLink href="/data">All categories →</RailAllLink>
          </RailCard>
        </Rail>
      </Layout>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--s-8) var(--s-14);
`;

const Hero = styled.div`
  padding: var(--s-8) 0;
  border-bottom: 1px solid var(--border);
`;

const Lede = styled.p`
  font-size: var(--text-lg);
  margin-top: var(--s-3);
  max-width: 620px;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: var(--s-8);
  padding: var(--s-8) 0;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
  background: var(--surface);
  align-self: start;
`;

const Rail = styled.div`
  align-self: start;
`;

const RailCard = styled.div`
  background: var(--surface);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-card);
  padding: var(--s-4);
`;

const RailLabel = styled.div`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: var(--s-2);
`;

const RailRow = styled(Link)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--s-2) 0;
  border-top: 1px solid var(--border);
  font-size: var(--text-sm);
  color: var(--primary);
  font-weight: 500;
`;

const RailCount = styled.span`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--fg-subtle);
`;

const RailAllLink = styled(Link)`
  display: block;
  margin-top: var(--s-3);
  padding-top: var(--s-3);
  border-top: 1px solid var(--border);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--fg);
`;
