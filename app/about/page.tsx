import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import AboutContent from "./components/AboutContent";

export const metadata: Metadata = {
  title: "About – CSV Preview | Your Data Never Leaves Your Browser",
  description:
    "CSV Preview is a minimal, privacy-first tool for inspecting CSV files entirely in your browser. No server, no signups",
  keywords: [
    "about CSV Preview",
    "privacy CSV tool",
    "browser-only CSV viewer",
    "local CSV processing",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: "About – CSV Preview | Your Data Never Leaves Your Browser",
    description:
      "CSV Preview is a minimal, privacy-first tool for inspecting CSV files entirely in your browser. No server, no signup — built with Next.js, React, and TypeScript.",
    type: "website",
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
