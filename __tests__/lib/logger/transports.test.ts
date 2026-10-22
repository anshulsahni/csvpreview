import { consoleTransport, createMemoryTransport } from "@/lib/logger/transports";
import type { LogLevel, LogRecord } from "@/lib/logger/types";

function record(level: LogLevel): LogRecord {
  return {
    timestamp: "2026-10-21T10:15:00.000Z",
    level,
    message: "m",
    context: { a: 1 },
  };
}

describe("consoleTransport", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each<LogLevel>(["debug", "info", "warn", "error"])(
    "writes %s records as one JSON line to the matching console method",
    (level) => {
      const spy = jest.spyOn(console, level).mockImplementation(() => {});
      consoleTransport(record(level));
      expect(spy).toHaveBeenCalledTimes(1);
      const [line] = spy.mock.calls[0];
      expect(typeof line).toBe("string");
      expect(line).not.toContain("\n");
      expect(JSON.parse(line as string)).toEqual(record(level));
    },
  );
});

describe("createMemoryTransport", () => {
  it("stores records and clears them", () => {
    const memory = createMemoryTransport();
    memory.transport(record("info"));
    expect(memory.records).toEqual([record("info")]);
    memory.clear();
    expect(memory.records).toEqual([]);
  });
});
