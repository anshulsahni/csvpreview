import Link from "next/link";
import { css } from "@linaria/core";

const hero = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem;
  text-align: center;
  gap: 1.5rem;
`;

const title = css`
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.2;
`;

const subtitle = css`
  font-size: 1.1rem;
  opacity: 0.6;
  max-width: 480px;
`;

const cta = css`
  display: inline-block;
  padding: 0.75rem 2rem;
  background: var(--primary);
  color: #fff;
  border-radius: 6px;
  font-weight: 600;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
`;

export default function Hero() {
  return (
    <section className={hero}>
      <h1 className={title}>Preview CSV files instantly</h1>
      <p className={subtitle}>
        Upload any CSV file and explore your data with a clean, readable table.
      </p>
      <Link href="/csv-preview" className={cta}>
        Get started
      </Link>
    </section>
  );
}
