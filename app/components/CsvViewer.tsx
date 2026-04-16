"use client";

import { useState, ChangeEvent, useEffect } from "react";
import SpreadsheetGrid from "./SpreadsheetGrid";

type CsvData = string[][];

const LS_KEY_DATA = "csvpreview_data";
const LS_KEY_NAME = "csvpreview_filename";

export default function CsvViewer() {
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [fileName, setFileName] = useState<string>("");

  useEffect(() => {
    const savedData = localStorage.getItem(LS_KEY_DATA);
    const savedName = localStorage.getItem(LS_KEY_NAME);
    if (savedData) {
      setCsvData(JSON.parse(savedData));
      setFileName(savedName ?? "");
    }
  }, []);

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.trim().split("\n").map((row) => row.split(","));
      setCsvData(rows);
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(rows));
      localStorage.setItem(LS_KEY_NAME, file.name);
    };
    reader.readAsText(file);
  }

  function handleClear() {
    setCsvData(null);
    setFileName("");
    localStorage.removeItem(LS_KEY_DATA);
    localStorage.removeItem(LS_KEY_NAME);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "0.5rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <input type="file" accept=".csv" onChange={handleFileUpload} />
        {csvData && (
          <button onClick={handleClear}>Clear</button>
        )}
        {fileName && (
          <span style={{ fontSize: "0.85rem", color: "var(--foreground)", opacity: 0.6 }}>
            {fileName}
          </span>
        )}
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <SpreadsheetGrid data={csvData ?? []} />
      </div>
    </div>
  );
}
