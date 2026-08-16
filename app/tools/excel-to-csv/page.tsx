import type { Metadata } from "next";
import AboutNavbar from "@/app/about/components/AboutNavbar";
import Breadcrumb from "@/app/components/Breadcrumb";
import ExcelToCsvConverter from "./components/ExcelToCsvConverter";
import Faq, { faqItems } from "./components/Faq";
import { BRAND, BRAND_NAME, brandOpenGraphImages } from "@/lib/brand";
import { requireTool } from "@/lib/tools";

const tool = requireTool("excel-to-csv");

const PAGE_URL = "https://csvpreview.com/tools/excel-to-csv";
const title = "Free Excel to CSV Converter – Convert XLSX to CSV Online";
const description =
  "Convert Excel (.xlsx) files to CSV for free, right in your browser. Every worksheet becomes its own CSV — rename, download individually or as a zip, or copy to the clipboard. No uploads, no signup, 100% private.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Excel to CSV",
    "XLSX to CSV",
    "convert Excel to CSV",
    "Excel to CSV online",
    "multi-sheet Excel to CSV",
    "free Excel to CSV converter",
    "split Excel sheets into CSV",
    "privacy-first Excel converter",
    "Browser only Excel to CSV converter",
    "Client only Excel to CSV converter",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "/tools/excel-to-csv" },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/tools/excel-to-csv",
    images: brandOpenGraphImages,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [BRAND.logo1024],
  },
};

// Structured data to help Google and GenAI search surface this as a free,
// browser-based tool with quick answers to common questions.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "Excel to CSV Converter",
      url: PAGE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript",
      description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@type": "Organization", name: BRAND_NAME },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ],
};

export default function ExcelToCsvPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <AboutNavbar />
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Tools", href: "/tools" },
          { label: tool.name },
        ]}
      />
      <main>
        <ExcelToCsvConverter />
        <Faq />
      </main>
    </>
  );
}
