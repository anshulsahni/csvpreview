import Navbar from "@/app/components/Navbar";
import CsvViewer from "@/app/components/CsvViewer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <CsvViewer />
      </main>
    </>
  );
}
