import { css } from "@linaria/core";

const section = css`
  max-width: 640px;
  margin: 4rem auto;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const heading = css`
  font-size: 2rem;
  font-weight: 700;
`;

const body = css`
  line-height: 1.7;
  opacity: 0.7;
`;

const stack = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const tag = css`
  padding: 0.3rem 0.75rem;
  background: #f3f4f6;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const TECH = ["Next.js 16", "React 19", "TypeScript", "Linaria CSS"];

export default function AboutContent() {
  return (
    <section className={section}>
      <h1 className={heading}>About</h1>
      <p className={body}>
        CSV Preview is a minimal web app for quickly inspecting CSV files in your
        browser. No data is sent to a server — everything is processed locally.
      </p>
      <div className={stack}>
        {TECH.map((t) => (
          <span key={t} className={tag}>
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}
