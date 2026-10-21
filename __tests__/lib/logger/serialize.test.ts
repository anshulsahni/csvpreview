import { sanitizeMessage } from "@/lib/errorScrubber";
import {
  CIRCULAR,
  REDACTED,
  serializeContext,
  serializeError,
  serializeValue,
  TRUNCATED,
} from "@/lib/logger/serialize";

describe("serializeError", () => {
  it("keeps name, message, and stack", () => {
    const error = new TypeError("bad input");
    expect(serializeError(error)).toEqual({
      name: "TypeError",
      message: "bad input",
      stack: error.stack,
    });
  });

  it("keeps the Next.js digest", () => {
    const error = Object.assign(new Error("hidden"), { digest: "123456" });
    expect(serializeError(error).digest).toBe("123456");
  });

  it("serializes the cause", () => {
    const error = new Error("outer", { cause: new RangeError("inner") });
    expect(serializeError(error).cause).toMatchObject({ name: "RangeError", message: "inner" });
  });

  it("serializes a non-error cause", () => {
    const error = new Error("outer", { cause: { code: 42 } });
    expect(serializeError(error).cause).toEqual({ code: 42 });
  });

  it("redacts an unsafe message, also in the stack", () => {
    const error = new Error("Unexpected token in row: jane@example.com");
    const result = serializeError(error, { sanitizeErrorMessage: sanitizeMessage });
    expect(result.message).toBe("[redacted]");
    expect(result.stack).not.toContain("jane@example.com");
    expect(result.stack?.split("\n")[0]).toBe("Error: [redacted]");
  });

  it("keeps a message on the safe list", () => {
    const error = new Error("Invalid dataset slug");
    const result = serializeError(error, { sanitizeErrorMessage: sanitizeMessage });
    expect(result.message).toBe("Invalid dataset slug");
  });

  it("omits an empty message", () => {
    expect(serializeError(new Error(""))).not.toHaveProperty("message");
  });
});

describe("serializeValue", () => {
  it("keeps primitives", () => {
    expect(serializeValue("a")).toBe("a");
    expect(serializeValue(1)).toBe(1);
    expect(serializeValue(false)).toBe(false);
    expect(serializeValue(null)).toBeNull();
  });

  it("turns BigInt into a string", () => {
    expect(serializeValue(BigInt(10) ** BigInt(20))).toBe("100000000000000000000");
  });

  it("turns Date into an ISO string", () => {
    expect(serializeValue(new Date("2026-10-21T00:00:00.000Z"))).toBe("2026-10-21T00:00:00.000Z");
    expect(serializeValue(new Date("nope"))).toBe("Invalid Date");
  });

  it("drops functions, symbols, and undefined", () => {
    expect(serializeValue(() => 1)).toBeUndefined();
    expect(serializeValue(Symbol("s"))).toBeUndefined();
    expect(serializeValue(undefined)).toBeUndefined();
    expect(serializeValue({ a: 1, b: undefined, c: () => 1 })).toEqual({ a: 1 });
  });

  it("writes dropped array items as null, like JSON", () => {
    expect(serializeValue([1, undefined, () => 1])).toEqual([1, null, null]);
  });

  it("replaces circular references", () => {
    const object: Record<string, unknown> = { a: 1 };
    object.self = object;
    expect(serializeValue(object)).toEqual({ a: 1, self: CIRCULAR });
  });

  it("handles a circular error cause", () => {
    const error = new Error("loop");
    (error as { cause?: unknown }).cause = error;
    expect(serializeValue(error)).toMatchObject({ name: "Error", cause: CIRCULAR });
  });

  it("writes an object referenced twice side by side, not as circular", () => {
    const shared = { x: 1 };
    expect(serializeValue({ a: shared, b: shared })).toEqual({ a: { x: 1 }, b: { x: 1 } });
  });

  it("keeps five levels of objects and truncates the rest", () => {
    const deep = { l1: { l2: { l3: { l4: { l5: { l6: 1 } } } } } };
    expect(serializeValue(deep)).toEqual({ l1: { l2: { l3: { l4: { l5: TRUNCATED } } } } });
  });

  it("redacts matching keys at any depth", () => {
    const options = { redactKeys: new Set(["fileName"]) };
    expect(serializeValue({ fileName: "a.csv", nested: { fileName: "b.csv", ok: 1 } }, options)).toEqual({
      fileName: REDACTED,
      nested: { fileName: REDACTED, ok: 1 },
    });
  });
});

describe("serializeContext", () => {
  it("serializes an error under any key", () => {
    const result = serializeContext({ error: new Error("boom"), slug: "x" });
    expect(result).toMatchObject({ error: { name: "Error", message: "boom" }, slug: "x" });
  });

  it("produces output that JSON.stringify accepts", () => {
    const object: Record<string, unknown> = { big: BigInt(1) };
    object.self = object;
    expect(() => JSON.stringify(serializeContext(object))).not.toThrow();
  });
});
