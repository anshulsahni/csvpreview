"use client";

import { useRef } from "react";
import { styled } from "@linaria/react";

const Dropzone = styled.div`
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

const Label = styled.p`
  font-size: 1rem;
  opacity: 0.6;
`;

const Button = styled.button`
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
    <Dropzone onClick={() => inputRef.current?.click()}>
      <Label>Drop a CSV file here or click to browse</Label>
      <Button type="button">Choose file</Button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        hidden
        onChange={handleChange}
      />
    </Dropzone>
  );
}
