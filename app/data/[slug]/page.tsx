import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import SpreadsheetGrid from "@/app/components/SpreadsheetGrid";
import { parseCSV } from "@/lib/csvParser";
import { datasets, getDatasetBySlug } from "@/lib/datasets";
import { loadDatasetCsv } from "@/lib/datasets/loadCsv";
import OpenInEditorButton from "./OpenInEditorButton";

export const dynamicParams = false;

export function generateStaticParams() {
  return datasets.map((d) => ({ slug: d.slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata(
  { params }: { params: Params },
): Promise<Metadata> {
  const { slug } = await params;
  const ds = getDatasetBySlug(slug);
  if (!ds) return {};
  const url = `/data/${ds.slug}`;
  return {
    title: ds.title,
    description: ds.description,
    keywords: ds.keywords,
    robots: { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: {
      title: ds.title,
      description: ds.description,
      type: "article",
      url,
    },
  };
}

export default async function DatasetPage({ params }: { params: Params }) {
  const { slug } = await params;
  const ds = getDatasetBySlug(slug);
  if (!ds) notFound();

  const csv = await loadDatasetCsv(ds.slug);
  const { rows } = parseCSV(csv);

  return (
    <>
      <Navbar />
      <main
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: "1rem 2rem",
          gap: "0.75rem",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem" }}>{ds.h1 ?? ds.title}</h1>
            {ds.intro && (
              <p style={{ margin: "0.5rem 0 0", opacity: 0.75, maxWidth: "60ch" }}>
                {ds.intro}
              </p>
            )}
          </div>
          <OpenInEditorButton rows={rows} filename={`${ds.slug}.csv`} />
        </header>
        <div style={{ flex: 1, minHeight: 0 }}>
          <SpreadsheetGrid
            data={rows}
            firstRowAsHeader={ds.firstRowAsHeader ?? true}
          />
        </div>
      </main>
    </>
  );
}
