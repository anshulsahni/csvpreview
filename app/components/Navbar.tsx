import Image from "next/image";
import Link from "next/link";
import { styled } from "@linaria/react";
import { BRAND, BRAND_NAME } from "@/lib/brand";

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--border);
`;

const BrandLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: inherit;

  &:hover {
    opacity: 0.92;
  }
`;

const Brand = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
`;

const Links = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-left: auto;

  a {
    font-size: 0.9rem;
    color: var(--foreground);
    opacity: 0.7;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }
`;

export default function Navbar() {
  return (
    <Nav>
      <BrandLink href="/" aria-label={`${BRAND_NAME} home`}>
        <Image src={BRAND.mark128} alt="" width={32} height={32} priority />
        <Brand>{BRAND_NAME}</Brand>
      </BrandLink>
      <Links>
        <Link href="/about">About</Link>
      </Links>
    </Nav>
  );
}
