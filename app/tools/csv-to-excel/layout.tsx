import "@/app/about/about.css";

export default function CsvToExcelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="about-theme">{children}</div>;
}
