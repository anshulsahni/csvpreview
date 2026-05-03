import Image from "next/image";
import Link from "next/link";
import { styled } from "@linaria/react";
import { BRAND, BRAND_NAME } from "@/lib/brand";
import { datasets } from "@/lib/datasets";

export default function AboutContent() {
  return (
    <>
      <Section>
        <LogoWrap>
          <Image
            src={BRAND.logo1024}
            alt={`${BRAND_NAME} logo`}
            fill
            sizes="14rem"
            style={{ objectFit: "contain" }}
            priority
          />
        </LogoWrap>
        <Heading>About CSV Preview</Heading>
        <Lede>
          CSV Preview is a lightweight, browser-based CSV viewer and editor. Open a spreadsheet in one or two clicks
          and explore it instantly — without uploading your data to any server.
        </Lede>

        <SubHeading>What you can do</SubHeading>
        <FeatureList>
          <li>
            Open a <code>.csv</code> file from your computer, or drag and drop one onto the upload dialog.
          </li>
          <li>Paste CSV content straight from your clipboard, or start from a blank sheet.</li>
          <li>Toggle the first row as a header so it stays pinned while you scroll.</li>
          <li>Sort any column ascending or descending with one click.</li>
          <li>Filter rows by selecting values from a column, searching, or comparing numbers.</li>
          <li>Pick up where you left off — your current sheet is kept locally in your browser.</li>
        </FeatureList>

        <SubHeading>Privacy by default</SubHeading>
        <Body>
          Your data never leaves your browser. There are no accounts, no uploads, and no servers parsing your files.
          Everything happens on your device, and you can clear it any time.
        </Body>
      </Section>

      <SeoFooter aria-label="Sample CSV datasets">
        <SeoFooterTitle>Sample datasets</SeoFooterTitle>
        <SeoLinks>
          {datasets.map((dataset) => (
            <li key={dataset.slug}>
              <Link href={`/data/${dataset.slug}`} prefetch={false}>
                {dataset.title}
              </Link>
            </li>
          ))}
        </SeoLinks>
      </SeoFooter>
    </>
  );
}

const Section = styled.section`
  max-width: 720px;
  margin: 4rem auto 2rem;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const LogoWrap = styled.div`
  width: min(14rem, 100%);
  aspect-ratio: 1;
  position: relative;
`;

const Heading = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
`;

const Lede = styled.p`
  font-size: 1.05rem;
  line-height: 1.7;
  margin: 0;
  opacity: 0.85;
`;

const SubHeading = styled.h2`
  font-size: 1.15rem;
  font-weight: 600;
  margin: 0.5rem 0 0;
`;

const FeatureList = styled.ul`
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  line-height: 1.6;
  opacity: 0.85;
`;

const Body = styled.p`
  line-height: 1.7;
  margin: 0;
  opacity: 0.75;
`;

const SeoFooter = styled.footer`
  max-width: 720px;
  margin: 2rem auto 4rem;
  padding: 1.25rem 2rem 0;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.8rem;
  opacity: 0.55;
`;

const SeoFooterTitle = styled.span`
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

const SeoLinks = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;

  a {
    color: var(--foreground);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;