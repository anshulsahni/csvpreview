import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import AnalyticsProvider from "@/app/components/AnalyticsProvider";
import { KeyboardShortcutsProvider } from "@/app/components/KeyboardShortcuts";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import { THEME_COOKIE_KEY, isTheme, Theme } from "@/lib/theme";
import ThemeToggle from "@/app/components/ThemeToggle";
import { BRAND, brandOpenGraphImages } from "@/lib/brand";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stored = (await cookies()).get(THEME_COOKIE_KEY)?.value;
  const theme: Theme = isTheme(stored) ? stored : Theme.System;

  return (
    <html lang="en" data-theme={theme}>
      <body>
        <ThemeProvider initialTheme={theme}>
          <KeyboardShortcutsProvider>
            <AnalyticsProvider>{children}</AnalyticsProvider>
          </KeyboardShortcutsProvider>
          <ThemeToggle />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
