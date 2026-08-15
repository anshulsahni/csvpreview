import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Breadcrumb from "@/app/components/Breadcrumb";
import { BRAND, brandOpenGraphImages } from "@/lib/brand";
import {
  categories,
  getCategoryBySlug,
  getCategoryPath,
  getDatasetsForCategory,
} from "@/lib/datasets/categories";
import "../data-theme.css";
import CategoryContent from "./components/CategoryContent";

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

type Params = Promise<{ category: string }>;

export async function generateMetadata(
  { params }: { params: Params },
): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category) return {};

  const title = `${category.name} Datasets (CSV) | CSV Preview`;
  const description = `${category.blurb} Free CSV downloads — sort, filter, and preview each dataset directly in your browser.`;
  const url = getCategoryPath(category.slug);

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      images: brandOpenGraphImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [BRAND.logo1024],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Params;
}) {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const categoryDatasets = getDatasetsForCategory(category.slug);
  const otherCategories = categories.filter((c) => c.slug !== category.slug);

  return (
    <>
      <Navbar />
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Data", href: "/data" },
          { label: category.name },
        ]}
      />
      <div className="data-theme">
        <CategoryContent
          category={category}
          datasets={categoryDatasets}
          otherCategories={otherCategories}
        />
      </div>
    </>
  );
}
