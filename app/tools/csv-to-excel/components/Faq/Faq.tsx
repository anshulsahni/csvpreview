import { styled } from "@linaria/react";
import { faqItems } from "./faqItems";

export default function Faq() {
  return (
    <Section aria-labelledby="faq-heading">
      <EyebrowLabel>faq</EyebrowLabel>
      <Heading id="faq-heading">Frequently asked questions</Heading>
      <List>
        {faqItems.map((item) => (
          <Item key={item.question}>
            <Question>{item.question}</Question>
            <Answer>{item.answer}</Answer>
          </Item>
        ))}
      </List>
    </Section>
  );
}

const Section = styled.section`
  max-width: 680px;
  margin: 0 auto;
  padding: 0 var(--s-8) var(--s-18);
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
`;

const EyebrowLabel = styled.span`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--primary);
`;

const Heading = styled.h2`
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  line-height: 1.1;
  letter-spacing: -0.5px;
  color: var(--fg);
`;

const List = styled.dl`
  display: flex;
  flex-direction: column;
  gap: var(--s-5);
  margin: 0;
`;

const Item = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
`;

const Question = styled.dt`
  font-size: var(--text-lg);
  color: var(--fg);
`;

const Answer = styled.dd`
  margin: 0;
  font-size: var(--text-md);
  line-height: 1.6;
  color: var(--fg-muted);
`;
