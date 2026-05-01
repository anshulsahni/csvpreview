import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import AboutContent from "./components/AboutContent";

export const metadata: Metadata = {
  title: "About – CSV Preview | Browser-Based CSV Viewer & Editor",
  description:
    "Learn what CSV Preview is: a privacy-first, browser-based CSV viewer and editor. Open, sort, filter, and edit CSV files locally — no server, no signup.",
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
    title: "About – CSV Preview | Browser-Based CSV Viewer & Editor",
    description:
      "CSV Preview is a privacy-first CSV viewer and editor that runs entirely in your browser. Upload, paste, sort, filter, and edit CSV files locally — no server, no signup.",
    type: "website",
    url: "/about",
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
