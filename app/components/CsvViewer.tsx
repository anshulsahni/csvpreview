"use client";

import { useState, ChangeEvent } from "react";

type CsvData = string[][];

export default function CsvViewer() {
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [fileName, setFileName] = useState<string>("");

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.trim().split("\n").map((row) => row.split(","));
      setCsvData(rows);
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      {fileName && <p>File: {fileName}</p>}
      {csvData && (
        <table border={1} cellPadding={4} style={{ borderCollapse: "collapse", marginTop: "1rem" }}>
          <tbody>
            {csvData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  rowIndex === 0
                    ? <th key={colIndex}>{cell}</th>
                    : <td key={colIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
