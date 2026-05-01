import Link from "next/link";
import { styled } from "@linaria/react";

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--border);
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
      <Brand>CSV Preview</Brand>
      <Links>
        <Link href="/about">About</Link>
      </Links>
    </Nav>
  );
}
