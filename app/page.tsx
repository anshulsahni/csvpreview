import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import CsvViewer from "@/app/components/CsvViewer";
import { BRAND, brandOpenGraphImages } from "@/lib/brand";

const title = "CSV Preview – Privacy-First CSV Viewer in Your Browser";
const description =
  "Open and preview CSV files instantly in your browser. Your data never leaves your device — no server uploads, no signup required.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "CSV viewer",
    "CSV preview",
    "open CSV online",
    "CSV file reader",
    "privacy-first CSV viewer",
    "browser CSV tool",
    "no upload CSV",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    type: "website",
    images: brandOpenGraphImages,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [BRAND.logo1024],
  },
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <CsvViewer />
      </main>
    </>
  );
}
