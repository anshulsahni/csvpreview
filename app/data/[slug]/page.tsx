import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { BRAND, brandOpenGraphImages } from "@/lib/brand";
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
      images: brandOpenGraphImages,
    },
    twitter: {
      card: "summary_large_image",
      title: ds.title,
      description: ds.description,
      images: [BRAND.logo1024],
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
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <div
            style={{
              padding: "0.5rem 1rem",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <OpenInEditorButton rows={rows} filename={`${ds.slug}.csv`} />
            <h1
              style={{
                margin: 0,
                fontSize: "0.95rem",
                fontWeight: 600,
                opacity: 0.75,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {ds.title}
            </h1>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <SpreadsheetGrid
              data={rows}
              firstRowAsHeader={ds.firstRowAsHeader ?? true}
            />
          </div>
        </div>
      </main>
    </>
  );
}
