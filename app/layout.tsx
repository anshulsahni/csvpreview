import type { Metadata } from "next";
import "./globals.css";
import AnalyticsProvider from "@/app/components/AnalyticsProvider";

export const metadata: Metadata = {
  title: "CSV Preview – View CSV Files Instantly in Your Browser",
  description:
    "CSV Preview lets you open and inspect CSV files directly in your browser. Privacy-first — no server, no signup, your data stays local.",
  keywords: ["CSV viewer", "CSV preview", "open CSV online", "CSV file reader", "privacy CSV"],
  robots: { index: true, follow: true },
  openGraph: {
    title: "CSV Preview – View CSV Files Instantly in Your Browser",
    description:
      "Open and inspect CSV files directly in your browser. Privacy-first — no server, no signup, your data stays local.",
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
      <body>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
