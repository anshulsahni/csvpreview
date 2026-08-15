import Link from "next/link";
import { styled } from "@linaria/react";
import { computeBreadcrumbJsonLd } from "./hooks";

const BASE_URL = "https://csvpreview.com";

export interface BreadcrumbItem {
  label: string;
  /** Omit for the current page (last item). */
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const jsonLd = computeBreadcrumbJsonLd(items, BASE_URL);

  return (
    <Nav aria-label="Breadcrumb">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <List>
        {items.map((item, index) => (
          <Item key={`${item.label}-${index}`}>
            {item.href ? (
              <Crumb href={item.href}>{item.label}</Crumb>
            ) : (
              <Current aria-current="page">{item.label}</Current>
            )}
            {index < items.length - 1 && <Separator aria-hidden="true">›</Separator>}
          </Item>
        ))}
      </List>
    </Nav>
  );
}

const Nav = styled.nav`
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--border);
`;

const List = styled.ol`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.8rem;
`;

const Item = styled.li`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`;

const Crumb = styled(Link)`
  color: var(--foreground);
  opacity: 0.65;
  transition: opacity 0.15s;

  &:hover {
    opacity: 1;
  }
`;

const Current = styled.span`
  color: var(--foreground);
  opacity: 0.9;
  font-weight: 500;
`;

const Separator = styled.span`
  color: var(--foreground);
  opacity: 0.35;
`;
