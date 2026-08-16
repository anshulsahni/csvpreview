import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Breadcrumb from "@/app/components/Breadcrumb";
import DatasetJsonLd from "@/app/components/DatasetJsonLd";
import { BRAND, brandOpenGraphImages, SITE_URL } from "@/lib/brand";
import SpreadsheetGrid from "@/app/components/SpreadsheetGrid";
import CountPills from "@/app/components/CountPills";
import { computeCsvCounts } from "@/app/components/CountPills/hooks";
import { parseCSV } from "@/lib/csvParser";
import { getDatasetBySlug } from "@/lib/datasets";
import { loadDatasetCsv } from "@/lib/datasets/loadCsv";
import {
  getCategoryForDataset,
  getCategoryPath,
  getDatasetPath,
  getDatasetStaticParams,
} from "@/lib/datasets/categories";
import OpenInEditorButton from "./OpenInEditorButton";

export const dynamicParams = false;

export function generateStaticParams() {
  return getDatasetStaticParams();
}

type Params = Promise<{ category: string; slug: string }>;

export async function generateMetadata(
  { params }: { params: Params },
): Promise<Metadata> {
  const { category: categorySlug, slug } = await params;
  const ds = getDatasetBySlug(slug);
  const category = getCategoryForDataset(slug);
  if (!ds || !category || category.slug !== categorySlug) return {};
  const url = getDatasetPath(category.slug, ds.slug);
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
  const { category: categorySlug, slug } = await params;
  const ds = getDatasetBySlug(slug);
  const category = getCategoryForDataset(slug);
  // Guard the pair, not just the slug — otherwise the same dataset would
  // render under any category slug and duplicate itself across URLs.
  if (!ds || !category || category.slug !== categorySlug) notFound();

  const csv = await loadDatasetCsv(ds.slug);
  const { rows } = parseCSV(csv);
  const firstRowAsHeader = ds.firstRowAsHeader ?? true;
  const counts = computeCsvCounts(rows, firstRowAsHeader);
  const columns = firstRowAsHeader && rows.length > 0 ? rows[0] : [];

  return (
    <>
      <DatasetJsonLd
        meta={ds}
        path={getDatasetPath(category.slug, ds.slug)}
        baseUrl={SITE_URL}
        columns={columns}
      />
      <Navbar />
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Data", href: "/data" },
          { label: category.name, href: getCategoryPath(category.slug) },
          { label: ds.title },
        ]}
      />
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
                flex: 1,
                minWidth: 0,
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
            <div style={{ marginLeft: "auto", display: "inline-flex" }}>
              <CountPills
                rowCount={counts.rowCount}
                totalRowCount={counts.totalRowCount}
                columnCount={counts.columnCount}
                hasActiveFilter={counts.hasActiveFilter}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <SpreadsheetGrid
              data={rows}
              firstRowAsHeader={firstRowAsHeader}
            />
          </div>
        </div>
      </main>
    </>
  );
}
