import type { LogRecord, Transport } from "./types";

/**
 * Write each record as one line of JSON to the matching console method.
 * On Vercel, these lines appear in the runtime logs.
 */
export const consoleTransport: Transport = (record) => {
  console[record.level](JSON.stringify(record));
};

export interface MemoryTransport {
  transport: Transport;
  records: LogRecord[];
  clear(): void;
}

/** Keep records in an array. For tests. */
export function createMemoryTransport(): MemoryTransport {
  const records: LogRecord[] = [];
  return {
    transport: (record) => {
      records.push(record);
    },
    records,
    clear: () => {
      records.length = 0;
    },
  };
}
