import "@/app/about/about.css";

export default function CsvToExcelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `.about-theme` uses `flex: 1` (flex-basis: 0%), which caps the wrapper at
  // the body's fixed 100vh height and lets the cream background stop short when
  // the page content is taller than the viewport. `flex: 1 0 auto` keeps the
  // 100vh minimum but grows the wrapper with its content so the theme covers
  // the full scroll height.
  return (
    <div className="about-theme" style={{ flex: "1 0 auto" }}>
      {children}
    </div>
  );
}
