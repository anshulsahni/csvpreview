import "./about.css";

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`body { background: #F4EFD9; }`}</style>
      <div className="about-theme">{children}</div>
    </>
  );
}
