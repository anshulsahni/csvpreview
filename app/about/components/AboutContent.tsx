import Link from "next/link";
import { styled } from "@linaria/react";
import { datasets } from "@/lib/datasets";

const FEATURES = [
  <>
    Open a <code>.csv</code> file from your computer, or drag and drop one onto
    the upload dialog.
  </>,
  "Paste CSV content straight from your clipboard, or start from a blank sheet.",
  "Toggle the first row as a header so it stays pinned while you scroll.",
  "Sort any column ascending or descending with one click.",
  "Filter rows by selecting values from a column, searching, or comparing numbers.",
  "Pick up where you left off — your current sheet is kept locally in your browser.",
];

export default function AboutContent() {
  return (
    <>
      <Wrapper>
        <Hero>
          <EyebrowLabel>about</EyebrowLabel>
          <HeroHeading>About csvpreview</HeroHeading>
          <HeroLede>
            CSV Preview is a lightweight, browser-based CSV viewer and editor.
            Open a spreadsheet in one or two clicks and explore it instantly —
            without uploading your data to any server.
          </HeroLede>
        </Hero>

        <Divider />

        <Section>
          <SectionLabel>what you can do</SectionLabel>
          <FeatureList>
            {FEATURES.map((text, i) => (
              <FeatureItem key={i}>
                <Bullet aria-hidden="true">—</Bullet>
                <span>{text}</span>
              </FeatureItem>
            ))}
          </FeatureList>
        </Section>

        <Divider />

        <Section>
          <SectionLabel>privacy by default</SectionLabel>
          <PrivacyText>
            Your data never leaves your browser. There are no accounts, no
            uploads, and no servers parsing your files. Everything happens on
            your device, and you can clear it any time.
          </PrivacyText>
          <PrivacyChips>
            <Chip>No uploads</Chip>
            <Chip>No accounts</Chip>
            <Chip>No servers</Chip>
            <Chip>Works offline</Chip>
          </PrivacyChips>
        </Section>
      </Wrapper>

      <SeoFooter aria-label="Sample CSV datasets">
        <SeoInner>
          <SeoLabel>sample datasets</SeoLabel>
          <SeoLinks>
            {datasets.map((dataset) => (
              <li key={dataset.slug}>
                <Link href={`/data/${dataset.slug}`} prefetch={false}>
                  {dataset.title}
                </Link>
              </li>
            ))}
          </SeoLinks>
        </SeoInner>
      </SeoFooter>
    </>
  );
}

const Wrapper = styled.div`
  max-width: 680px;
  margin: 0 auto;
  padding: 0 var(--s-8) var(--s-10);
`;

const Hero = styled.div`
  padding: var(--s-14) 0 var(--s-10);
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
`;

const EyebrowLabel = styled.span`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--primary);
`;

const HeroHeading = styled.h1`
  font-family: var(--font-serif);
  font-size: var(--text-4xl);
  line-height: 1;
  letter-spacing: -1.5px;
  color: var(--fg);
`;

const HeroLede = styled.p`
  font-size: var(--text-lg);
  line-height: 1.6;
  color: var(--fg-muted);
  max-width: 560px;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--border);
  margin: 0;
`;

const Section = styled.section`
  padding: var(--s-10) 0;
  display: flex;
  flex-direction: column;
  gap: var(--s-6);
`;

const SectionLabel = styled.span`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--fg-subtle);
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
`;

const FeatureItem = styled.li`
  display: flex;
  gap: var(--s-4);
  font-size: var(--text-md);
  line-height: 1.6;
  color: var(--fg-muted);

  code {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--primary);
    background: var(--green-100);
    padding: 1px 5px;
    border-radius: var(--r-sm);
  }
`;

const Bullet = styled.span`
  font-family: var(--font-mono);
  color: var(--fg-subtle);
  flex-shrink: 0;
  /* margin-top: 1px; */
`;

const PrivacyText = styled.p`
  font-size: var(--text-md);
  line-height: 1.65;
  color: var(--fg-muted);
  max-width: 520px;
`;

const PrivacyChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
`;

const Chip = styled.span`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.5px;
  color: var(--primary);
  background: var(--green-100);
  border: 1px solid rgba(47, 107, 58, 0.2);
  border-radius: var(--r-pill);
  padding: var(--s-1) var(--s-3);
`;

const SeoFooter = styled.footer`
  border-top: 1px solid var(--border);
  background: var(--surface);
  padding: var(--s-8) var(--s-8);
`;

const SeoInner = styled.div`
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
`;

const SeoLabel = styled.span`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--fg-subtle);
`;

const SeoLinks = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);

  a {
    display: inline-block;
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--fg-subtle);
    background: var(--bg);
    border: 1px solid var(--border-strong);
    border-radius: var(--r-pill);
    padding: var(--s-1) var(--s-3);
    transition: color 0.15s, border-color 0.15s;

    &:hover {
      color: var(--fg);
      border-color: var(--ink-4);
    }
  }
`;
