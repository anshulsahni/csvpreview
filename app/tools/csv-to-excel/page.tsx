import type { Metadata } from "next";
import AboutNavbar from "@/app/about/components/AboutNavbar";
import CsvToExcelConverter from "./components/CsvToExcelConverter";
import Faq, { faqItems } from "./components/Faq";
import { BRAND, BRAND_NAME, brandOpenGraphImages } from "@/lib/brand";

const PAGE_URL = "https://csvpreview.com/tools/csv-to-excel";
const title = "Free CSV to Excel Converter – Convert CSV to XLSX Online";
const description =
  "Convert CSV files to Excel (.xlsx) for free, right in your browser. Upload one or many CSVs, merge them into a single workbook or download separately — no uploads, no signup, 100% private.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "CSV to Excel",
    "CSV to Excel converter",
    "convert CSV to XLSX",
    "CSV to XLSX online",
    "free CSV to Excel",
    "merge CSV files into Excel",
    "CSV to spreadsheet",
    "privacy-first CSV converter",
    "Browser only CSV to Excel converter",
    "Client only CSV to Excel converter",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "/tools/csv-to-excel" },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/tools/csv-to-excel",
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
      name: "CSV to Excel Converter",
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

export default function CsvToExcelPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <AboutNavbar />
      <main>
        <CsvToExcelConverter />
        <Faq />
      </main>
    </>
  );
}
