import Link from "next/link";
import { styled } from "@linaria/react";

const Section = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem;
  text-align: center;
  gap: 1.5rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.2;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  opacity: 0.6;
  max-width: 480px;
`;

const Cta = styled(Link)`
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
    <Section>
      <Title>Preview CSV files instantly</Title>
      <Subtitle>
        Upload any CSV file and explore your data with a clean, readable table.
      </Subtitle>
      <Cta href="/csv-preview">Get started</Cta>
    </Section>
  );
}
