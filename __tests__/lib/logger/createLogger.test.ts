import { createLogger } from "@/lib/logger/createLogger";
import { createMemoryTransport } from "@/lib/logger/transports";
import type { LoggerOptions, LogRecord } from "@/lib/logger/types";

const NOW = new Date("2026-10-21T10:15:00.000Z");

function setup(options: LoggerOptions = {}) {
  const memory = createMemoryTransport();
  const logger = createLogger({
    level: "debug",
    transports: [memory.transport],
    now: () => NOW,
    ...options,
  });
  return { logger, records: memory.records };
}

describe("createLogger", () => {
  it("writes a record with timestamp, level, message, and context", () => {
    const { logger, records } = setup();
    logger.info("Dataset loaded", { slug: "sp500", rowCount: 120 });
    expect(records).toEqual<LogRecord[]>([
      {
        timestamp: "2026-10-21T10:15:00.000Z",
        level: "info",
        message: "Dataset loaded",
        context: { slug: "sp500", rowCount: 120 },
      },
    ]);
  });

  it("omits context when there is none", () => {
    const { logger, records } = setup();
    logger.warn("Plain message");
    expect(records[0]).not.toHaveProperty("context");
  });

  it("writes each level", () => {
    const { logger, records } = setup();
    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    logger.error("e");
    expect(records.map((record) => record.level)).toEqual(["debug", "info", "warn", "error"]);
  });

  it("drops records below the minimum level", () => {
    const { logger, records } = setup({ level: "warn" });
    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    logger.error("e");
    expect(records.map((record) => record.message)).toEqual(["w", "e"]);
  });

  it("defaults to the info level", () => {
    const memory = createMemoryTransport();
    const logger = createLogger({ transports: [memory.transport] });
    logger.debug("d");
    logger.info("i");
    expect(memory.records.map((record) => record.message)).toEqual(["i"]);
  });

  it("writes nothing when silent", () => {
    const { logger, records } = setup({ level: "silent" });
    logger.error("e");
    expect(records).toHaveLength(0);
  });

  it("adds the base context to every record", () => {
    const { logger, records } = setup({ context: { env: "test" } });
    logger.info("m", { a: 1 });
    expect(records[0].context).toEqual({ env: "test", a: 1 });
  });

  describe("child", () => {
    it("binds context to every record", () => {
      const { logger, records } = setup({ context: { env: "test" } });
      const child = logger.child({ module: "datasets" });
      child.info("m", { slug: "x" });
      expect(records[0].context).toEqual({ env: "test", module: "datasets", slug: "x" });
    });

    it("nests", () => {
      const { logger, records } = setup();
      logger.child({ a: 1 }).child({ b: 2 }).info("m");
      expect(records[0].context).toEqual({ a: 1, b: 2 });
    });

    it("lets call-site context win over bound context", () => {
      const { logger, records } = setup();
      logger.child({ module: "bound" }).info("m", { module: "call" });
      expect(records[0].context).toEqual({ module: "call" });
    });

    it("does not change the parent", () => {
      const { logger, records } = setup();
      logger.child({ a: 1 });
      logger.info("m");
      expect(records[0]).not.toHaveProperty("context");
    });
  });

  it("applies redactKeys and sanitizeErrorMessage", () => {
    const { logger, records } = setup({
      redactKeys: ["fileName"],
      sanitizeErrorMessage: () => "[redacted]",
    });
    logger.error("m", { fileName: "secret.csv", error: new Error("row: jane") });
    expect(records[0].context).toMatchObject({
      fileName: "[REDACTED]",
      error: { name: "Error", message: "[redacted]" },
    });
  });

  it("never throws when a transport throws, and still runs the others", () => {
    const memory = createMemoryTransport();
    const logger = createLogger({
      transports: [
        () => {
          throw new Error("broken");
        },
        memory.transport,
      ],
    });
    expect(() => logger.info("m")).not.toThrow();
    expect(memory.records).toHaveLength(1);
  });

  it("never throws when the clock throws", () => {
    const { logger, records } = setup({
      now: () => {
        throw new Error("clock");
      },
    });
    expect(() => logger.info("m")).not.toThrow();
    expect(records).toHaveLength(0);
  });

  describe("flush", () => {
    it("resolves at once with sync transports", async () => {
      const { logger } = setup();
      logger.info("m");
      await expect(logger.flush()).resolves.toBeUndefined();
    });

    it("waits for async transports, including from children", async () => {
      const done: string[] = [];
      const logger = createLogger({
        transports: [
          (record) =>
            new Promise<void>((resolve) => {
              setTimeout(() => {
                done.push(record.message);
                resolve();
              }, 5);
            }),
        ],
      });
      logger.info("parent");
      logger.child({ a: 1 }).info("child");
      expect(done).toEqual([]);
      await logger.flush();
      expect(done).toEqual(["parent", "child"]);
    });

    it("does not reject when an async transport rejects", async () => {
      const logger = createLogger({ transports: [() => Promise.reject(new Error("x"))] });
      logger.info("m");
      await expect(logger.flush()).resolves.toBeUndefined();
    });
  });
});
