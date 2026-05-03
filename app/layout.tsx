import type { Metadata } from "next";
import "./globals.css";
import AnalyticsProvider from "@/app/components/AnalyticsProvider";
import { BRAND, brandOpenGraphImages } from "@/lib/brand";

const defaultTitle = "CSV Preview – View CSV Files Instantly in Your Browser";
const defaultDescription =
  "CSV Preview lets you open and inspect CSV files directly in your browser. Privacy-first — no server, no signup, your data stays local.";

export const metadata: Metadata = {
  metadataBase: new URL("https://csvpreview.com"),
  title: defaultTitle,
  description: defaultDescription,
  keywords: ["CSV viewer", "CSV preview", "open CSV online", "CSV file reader", "privacy CSV"],
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: BRAND.mark128, sizes: "128x128", type: "image/png" },
      { url: BRAND.mark512, sizes: "512x512", type: "image/png" },
    ],
    apple: BRAND.mark512,
  },
  openGraph: {
    title: defaultTitle,
    description:
      "Open and inspect CSV files directly in your browser. Privacy-first — no server, no signup, your data stays local.",
    type: "website",
    images: brandOpenGraphImages,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [BRAND.logo1024],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
