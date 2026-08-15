import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import Breadcrumb from "@/app/components/Breadcrumb";
import { BRAND, brandOpenGraphImages } from "@/lib/brand";
import "./data-theme.css";
import DataHubContent from "./components/DataHubContent";

const title = "Free CSV Datasets | CSV Preview";
const description =
  "Browse free, ready-to-use CSV datasets across geography, transport, economics, history, food, nature, science, language and architecture. Open any file instantly in your browser.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "free csv datasets",
    "sample csv files",
    "csv data download",
    "open datasets csv",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "/data" },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/data",
    images: brandOpenGraphImages,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [BRAND.logo1024],
  },
};

export default function DataHubPage() {
  return (
    <>
      <Navbar />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Data" }]} />
      <main className="data-theme">
        <DataHubContent />
      </main>
    </>
  );
}
