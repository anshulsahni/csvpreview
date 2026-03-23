"use client";

import { useRef } from "react";
import { css } from "@linaria/core";

const dropzone = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 3rem 2rem;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--primary);
  }
`;

const label = css`
  font-size: 1rem;
  opacity: 0.6;
`;

const button = css`
  padding: 0.5rem 1.25rem;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
`;

interface FileUploadProps {
  onFile: (file: File) => void;
}

export default function FileUpload({ onFile }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className={dropzone} onClick={() => inputRef.current?.click()}>
      <p className={label}>Drop a CSV file here or click to browse</p>
      <button className={button} type="button">
        Choose file
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        hidden
        onChange={handleChange}
      />
    </div>
  );
}
