import Link from "next/link";
import { styled } from "@linaria/react";
import { getDatasetBySlug } from "@/lib/datasets";

const DATASET_CATEGORIES: { label: string; slugs: string[] }[] = [
  {
    label: "Geography & Places",
    slugs: [
      "countries-capitals",
      "us-state-capitals",
      "indian-states",
      "country-codes",
      "world-population",
      "world-timezones",
      "mountain-heights",
      "world-rivers",
      "national-parks",
    ],
  },
  {
    label: "Transport",
    slugs: [
      "world-airports",
      "airline-codes",
      "busiest-airports",
      "high-speed-rail-networks",
      "metro-systems-world",
    ],
  },
  {
    label: "Economics & Finance",
    slugs: [
      "country-gdp",
      "sp500-companies",
      "currency-codes",
      "g20-g7-brics-members",
    ],
  },
  {
    label: "History & Politics",
    slugs: [
      "us-presidents",
      "indian-prime-ministers",
      "uk-prime-ministers",
      "independence-days",
      "un-member-states",
    ],
  },
  {
    label: "Food & Drink",
    slugs: [
      "world-cuisines",
      "top-crops-global",
      "coffee-producing-countries",
      "tea-varieties",
      "indian-sweets",
      "spices",
      "wine-regions",
      "calories-macros",
    ],
  },
  {
    label: "Animals & Nature",
    slugs: [
      "dog-breeds",
      "cat-breeds",
      "endangered-species-iucn",
      "animal-species-lifespan-diet-habitat",
    ],
  },
  {
    label: "Science",
    slugs: [
      "human-body-organs-functions",
      "planets-moons-solar-system",
      "periodic-table-elements",
      "major-earthquakes-history",
    ],
  },
  {
    label: "Language & Culture",
    slugs: ["most-spoken-languages", "indian-languages-by-state"],
  },
  {
    label: "Architecture",
    slugs: ["tallest-buildings-world", "longest-bridges-tunnels"],
  },
];

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

        <Divider />

        <Section>
          <SectionLabel>the developer</SectionLabel>
          <DevCard>
            <DevName>Anshul Sahni</DevName>
            <DevBio>
              Hi, I am Anshul Sahni. I love computers, and I love building
              software.
            </DevBio>

            <DevBio>
              I started building CSVPreview after getting inspired by
              jsonhero.io. I realised there was no good equivalent for editing
              or working with CSVs. I must admit, building something
              independently all by myself just for fun is one of the best
              feelings in the world. You have to figure out everything, from
              development to SEO to marketing to design, and the list goes on
              and on.
            </DevBio>

            <DevBio>
              If you&apos;re reading this, thank you very much for making it
              this far. I have one last favour to ask: would you like to become
              part of this journey? Come, let&apos;s build CSVPreview together.
              You can email me your suggestions, feedback, or simply say hi
              at&nbsp;
              <Link href="mailto:anshul_sahni@live.com">
                anshul_sahni@live.com
              </Link>
              .
            </DevBio>
            <SocialLinks>
              <SocialLink
                href="https://github.com/anshulsahni"
                aria-label="GitHub"
              >
                <SocialIcon>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </SocialIcon>
                GitHub
              </SocialLink>
              <SocialLink
                href="https://x.com/AnshulSahni93"
                aria-label="X / Twitter"
              >
                <SocialIcon>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </SocialIcon>
                X / Twitter
              </SocialLink>
              <SocialLink
                href="https://www.linkedin.com/in/anshulsahni/"
                aria-label="LinkedIn"
              >
                <SocialIcon>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </SocialIcon>
                LinkedIn
              </SocialLink>
              <SocialLink
                href="https://stackoverflow.com/users/3495515/anshul-sahni"
                aria-label="Stack Overflow"
              >
                <SocialIcon>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.986 21.865v-6.404h2.134V24H1.844v-8.539h2.13v6.404h15.012zM6.111 19.731H17.78v-2.137H6.111v2.137zm.259-4.852 11.529 2.409.44-2.042-11.529-2.41-.44 2.043zm1.359-5.056 10.681 4.97.89-1.903-10.682-4.97-.89 1.903zm2.748-4.814 9.094 7.529 1.354-1.638-9.094-7.53-1.354 1.639zM15.495 0l-1.714 1.254 7.144 9.749 1.714-1.254L15.495 0z" />
                  </svg>
                </SocialIcon>
                Stack Overflow
              </SocialLink>
              <SocialLink
                href="https://reddit.com/u/zeroansh"
                aria-label="Reddit"
              >
                <SocialIcon>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                  </svg>
                </SocialIcon>
                Reddit
              </SocialLink>
              <SocialLink
                href="https://www.instagram.com/anshul.sahni/"
                aria-label="Instagram"
              >
                <SocialIcon>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                  </svg>
                </SocialIcon>
                Instagram
              </SocialLink>
              <SocialLink
                href="https://www.facebook.com/anshul.sahni.52"
                aria-label="Facebook"
              >
                <SocialIcon>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                  </svg>
                </SocialIcon>
                Facebook
              </SocialLink>
            </SocialLinks>
          </DevCard>
        </Section>
      </Wrapper>

      <SeoFooter aria-label="Sample CSV datasets">
        <SeoLabel>sample datasets</SeoLabel>
        <SeoCategoryGrid>
          {DATASET_CATEGORIES.map((cat) => {
            const items = cat.slugs
              .map((slug) => getDatasetBySlug(slug))
              .filter(Boolean);
            if (!items.length) return null;
            return (
              <SeoCategory key={cat.label}>
                <SeoCategoryLabel>{cat.label}</SeoCategoryLabel>
                <SeoLinks>
                  {items.map((dataset) => (
                    <li key={dataset!.slug}>
                      <Link href={`/data/${dataset!.slug}`} prefetch={false}>
                        {dataset!.title}
                      </Link>
                    </li>
                  ))}
                </SeoLinks>
              </SeoCategory>
            );
          })}
        </SeoCategoryGrid>
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

const DevCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--s-5);
`;

const DevName = styled.h2`
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  color: var(--fg);
`;

const DevBio = styled.p`
  font-size: var(--text-md);
  line-height: 1.7;
  color: var(--fg-muted);
  max-width: 520px;
`;

const SocialLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-3);
`;

const SocialLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.3px;
  color: var(--fg-muted);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-pill);
  padding: var(--s-2) var(--s-4);
  transition:
    color 0.15s,
    border-color 0.15s,
    background 0.15s;

  &:hover {
    color: var(--fg);
    border-color: var(--ink-4);
    background: var(--cloud);
  }
`;

const SocialIcon = styled.span`
  display: flex;
  align-items: center;
  color: var(--fg-subtle);
`;

const SeoFooter = styled.footer`
  border-top: 1px solid var(--border);
  background: var(--surface);
  padding: var(--s-8) var(--s-10);
  display: flex;
  flex-direction: column;
  gap: var(--s-5);
`;

const SeoCategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s-8) var(--s-10);

  @media (max-width: 760px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const SeoLabel = styled.span`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--fg-subtle);
`;

const SeoCategory = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
`;

const SeoCategoryLabel = styled.span`
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--fg-subtle);
  letter-spacing: 0.3px;
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
