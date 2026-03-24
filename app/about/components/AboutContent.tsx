import { styled } from "@linaria/react";

const Section = styled.section`
  max-width: 640px;
  margin: 4rem auto;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Heading = styled.h1`
  font-size: 2rem;
  font-weight: 700;
`;

const Body = styled.p`
  line-height: 1.7;
  opacity: 0.7;
`;

const Stack = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Tag = styled.span`
  padding: 0.3rem 0.75rem;
  background: var(--subtle);
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const TECH = ["Next.js 16", "React 19", "TypeScript", "Linaria CSS"];

export default function AboutContent() {
  return (
    <Section>
      <Heading>About</Heading>
      <Body>
        CSV Preview is a minimal web app for quickly inspecting CSV files in your
        browser. No data is sent to a server — everything is processed locally.
      </Body>
      <Stack>
        {TECH.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </Stack>
    </Section>
  );
}
