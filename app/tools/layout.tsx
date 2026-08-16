import "./tools-theme.css";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `.tools-theme` uses `flex: 1` (flex-basis: 0%), which caps the wrapper at
  // the body's fixed 100vh height and lets the cream background stop short when
  // the page content is taller than the viewport. `flex: 1 0 auto` keeps the
  // 100vh minimum but grows the wrapper with its content so the theme covers
  // the full scroll height.
  return (
    <div className="tools-theme" style={{ flex: "1 0 auto" }}>
      {children}
    </div>
  );
}
