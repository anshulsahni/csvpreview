import Link from "next/link";
import { css } from "@linaria/core";

const nav = css`
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e5e7eb;
`;

const brand = css`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
`;

const links = css`
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
    <nav className={nav}>
      <span className={brand}>CSV Preview</span>
      <div className={links}>
        <Link href="/">Home</Link>
        <Link href="/csv-preview">CSV Preview</Link>
        <Link href="/about">About</Link>
      </div>
    </nav>
  );
}
