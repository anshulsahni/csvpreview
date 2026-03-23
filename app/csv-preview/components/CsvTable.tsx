import { css } from "@linaria/core";

const wrapper = css`
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const table = css`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;

  th,
  td {
    padding: 0.625rem 1rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
    white-space: nowrap;
  }

  th {
    background: #f9fafb;
    font-weight: 600;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background: #f3f4f6;
  }
`;

interface CsvTableProps {
  headers: string[];
  rows: string[][];
}

export default function CsvTable({ headers, rows }: CsvTableProps) {
  return (
    <div className={wrapper}>
      <table className={table}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
