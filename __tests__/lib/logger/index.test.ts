import { getLogLevel } from "@/lib/logger";

describe("getLogLevel", () => {
  it("picks the level from NODE_ENV", () => {
    expect(getLogLevel("production")).toBe("info");
    expect(getLogLevel("test")).toBe("silent");
    expect(getLogLevel("development")).toBe("debug");
    expect(getLogLevel(undefined)).toBe("debug");
  });
});
