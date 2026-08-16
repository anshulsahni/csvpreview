import { styled } from "@linaria/react";
import { tools } from "@/lib/tools";
import ToolCard from "./ToolCard";

export default function ToolsHubContent() {
  return (
    <Wrapper>
      <Hero>
        <HeroText>
          <h1>
            Free file tools,
            <br />
            run in your <Accent>browser</Accent>.
          </h1>
          <Lede>
            Convert between CSV and Excel without an account or an upload. Every
            file is processed on your own machine — nothing is sent to a server.
          </Lede>
        </HeroText>
        <Stats>
          <Stat>
            <StatNumber>{tools.length}</StatNumber>
            <StatLabel>TOOLS</StatLabel>
          </Stat>
          <Stat>
            <StatNumber>$0</StatNumber>
            <StatLabel>FOREVER</StatLabel>
          </Stat>
        </Stats>
      </Hero>
      <Grid>
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </Grid>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--s-8) var(--s-14);
`;

const Hero = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--s-10);
  flex-wrap: wrap;
  padding: var(--s-14) 0 var(--s-8);
  border-bottom: 1px solid var(--border);
`;

const HeroText = styled.div`
  max-width: 640px;
`;

const Accent = styled.span`
  font-style: italic;
  color: var(--primary);
`;

const Lede = styled.p`
  font-size: var(--text-lg);
  margin-top: var(--s-4);
  max-width: 560px;
`;

const Stats = styled.div`
  display: flex;
  gap: var(--s-8);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 1px;
  color: var(--fg-subtle);
  text-align: right;
  flex-shrink: 0;
`;

const Stat = styled.div``;

const StatNumber = styled.div`
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  color: var(--fg);
`;

const StatLabel = styled.div``;

const Grid = styled.div`
  padding: var(--s-8) 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s-5);

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;
