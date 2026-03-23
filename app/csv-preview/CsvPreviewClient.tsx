"use client";

import { useState } from "react";
import { css } from "@linaria/core";
import FileUpload from "./components/FileUpload";
import CsvTable from "./components/CsvTable";

const container = css`
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const heading = css`
  font-size: 1.75rem;
  font-weight: 700;
`;

const meta = css`
  font-size: 0.875rem;
  opacity: 0.5;
`;

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const [headerLine, ...lines] = text.trim().split("\n");
  const headers = headerLine.split(",").map((h) => h.trim());
  const rows = lines.map((line) => line.split(",").map((c) => c.trim()));
  return { headers, rows };
}

export default function CsvPreviewClient() {
  const [data, setData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [fileName, setFileName] = useState("");

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setData(parseCsv(text));
    };
    reader.readAsText(file);
  };

  return (
    <div className={container}>
      <h1 className={heading}>CSV Preview</h1>
      <FileUpload onFile={handleFile} />
      {data && (
        <>
          <p className={meta}>
            {fileName} — {data.rows.length} rows, {data.headers.length} columns
          </p>
          <CsvTable headers={data.headers} rows={data.rows} />
        </>
      )}
    </div>
  );
}
