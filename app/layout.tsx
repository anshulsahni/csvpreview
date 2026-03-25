import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSV Preview – View CSV Files Instantly in Your Browser",
  description:
    "CSV Preview lets you upload and preview CSV files directly in your browser. No server, no signup – your data stays local.",
  keywords: ["CSV viewer", "CSV preview", "open CSV online", "CSV file reader"],
  robots: { index: true, follow: true },
  openGraph: {
    title: "CSV Preview – View CSV Files Instantly in Your Browser",
    description:
      "Upload and preview CSV files directly in your browser. No server, no signup – your data stays local.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
