import Navbar from "@/app/components/Navbar";
import CsvViewer from "@/app/components/CsvViewer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main style={{ padding: "1rem" }}>
        <CsvViewer />
      </main>
    </>
  );
}
