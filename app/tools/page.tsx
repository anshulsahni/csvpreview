import type { Metadata } from "next";
import AboutNavbar from "@/app/about/components/AboutNavbar";
import Breadcrumb from "@/app/components/Breadcrumb";
import { BRAND, brandOpenGraphImages, SITE_URL } from "@/lib/brand";
import { tools } from "@/lib/tools";
import ToolsHubContent from "./components/ToolsHubContent";
import { computeToolsHubJsonLd } from "./components/toolsJsonLd";

const title = "Free CSV & Excel Tools | CSV Preview";
const description =
  "Every free CSV Preview tool in one place — convert CSV to Excel, split Excel workbooks into CSV files, and more. All of it runs in your browser, with no uploads and no signup.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "free csv tools",
    "free excel tools",
    "csv converter online",
    "excel converter online",
    "browser csv tools",
    "privacy-first file converter",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "/tools" },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/tools",
    images: brandOpenGraphImages,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [BRAND.logo1024],
  },
};

const structuredData = computeToolsHubJsonLd(tools, SITE_URL);

export default function ToolsHubPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <AboutNavbar />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Tools" }]} />
      <main>
        <ToolsHubContent />
      </main>
    </>
  );
}
