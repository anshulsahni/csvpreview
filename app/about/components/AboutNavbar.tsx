import Image from "next/image";
import Link from "next/link";
import { styled } from "@linaria/react";
import { BRAND, BRAND_NAME } from "@/lib/brand";

export default function AboutNavbar() {
  return (
    <Nav>
      <BrandLink href="/" aria-label={`${BRAND_NAME} home`}>
        <Image src={BRAND.mark128} alt="" width={32} height={32} priority />
        {BRAND_NAME.toLowerCase().replace(" ", "")}
      </BrandLink>
      <NavLinks>
        <Link href="/">app</Link>
      </NavLinks>
    </Nav>
  );
}

const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--s-5) var(--s-8);
  border-bottom: 1px solid var(--border);
`;

const BrandLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: var(--s-2);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--fg);
  letter-spacing: -0.5px;

  &:hover {
    color: var(--primary);
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: var(--s-6);

  a {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--fg-subtle);
    transition: color 0.15s;

    &:hover {
      color: var(--fg);
    }
  }
`;
