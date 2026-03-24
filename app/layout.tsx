import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSV Preview",
  description: "Preview CSV files with ease",
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
