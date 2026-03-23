import Navbar from "@/app/components/Navbar";
import CsvPreviewClient from "./CsvPreviewClient";

export default function CsvPreviewPage() {
  return (
    <>
      <Navbar />
      <main>
        <CsvPreviewClient />
      </main>
    </>
  );
}
