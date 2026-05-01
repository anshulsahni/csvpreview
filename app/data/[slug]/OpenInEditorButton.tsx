"use client";

import { useRouter } from "next/navigation";
import { styled } from "@linaria/react";
import { LS_KEY_DATA, LS_KEY_FILE_NAME } from "@/app/components/CsvViewer/hooks";

interface Props {
  rows: string[][];
  filename: string;
}

export default function OpenInEditorButton({ rows, filename }: Props) {
  const router = useRouter();

  function onClick() {
    try {
      localStorage.setItem(LS_KEY_DATA, JSON.stringify(rows));
      localStorage.setItem(LS_KEY_FILE_NAME, filename);
    } catch {
      // localStorage may be unavailable; navigate anyway — the editor will open the upload modal.
    }
    router.push("/");
  }

  return (
    <Button type="button" onClick={onClick}>
      Open in editor
    </Button>
  );
}

const Button = styled.button`
  background: var(--primary);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 0.4rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    filter: brightness(0.95);
  }
`;
