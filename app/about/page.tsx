import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import AboutContent from "./components/AboutContent";
import { BRAND, brandOpenGraphImages } from "@/lib/brand";

const title = "About – CSV Preview | Browser-Based CSV Viewer & Editor";
const description =
  "Learn what CSV Preview is: a privacy-first, browser-based CSV viewer and editor. Open, sort, filter, and edit CSV files locally — no server, no signup.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "about CSV Preview",
    "privacy CSV tool",
    "browser-only CSV viewer",
    "local CSV processing",
    "CSV editor",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "/about" },
  openGraph: {
    title,
    description:
      "CSV Preview is a privacy-first CSV viewer and editor that runs entirely in your browser. Upload, paste, sort, filter, and edit CSV files locally — no server, no signup.",
    type: "website",
    url: "/about",
    images: brandOpenGraphImages,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [BRAND.logo1024],
  },
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        <AboutContent />
      </main>
    </>
  );
}
