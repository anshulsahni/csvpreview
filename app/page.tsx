import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import CsvViewer from "@/app/components/CsvViewer";

export const metadata: Metadata = {
  title: "CSV Preview – Privacy-First CSV Viewer in Your Browser",
  description:
    "Open and preview CSV files instantly in your browser. Your data never leaves your device — no server uploads, no signup required.",
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
    title: "CSV Preview – Privacy-First CSV Viewer in Your Browser",
    description:
      "Open and preview CSV files instantly in your browser. Your data never leaves your device — no server uploads, no signup required.",
    type: "website",
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
