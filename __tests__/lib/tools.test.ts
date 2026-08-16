import {
  getOtherTools,
  getToolBySlug,
  getToolPath,
  requireTool,
  tools,
} from "@/lib/tools";

// Expected values are hardcoded fixtures at the bottom of this file — they are
// only read inside `it` bodies, which run after the module finishes evaluating.

describe("hardcoded expectations are self-consistent", () => {
  // Guards the fixtures themselves, so a typo there can't mask a regression.
  it("declares the stated number of tools, with no duplicates", () => {
    expect(EXPECTED_TOOL_SLUGS).toHaveLength(TOOL_COUNT);
    expect(Object.keys(TOOL_NAMES)).toHaveLength(TOOL_COUNT);
    expect(new Set(EXPECTED_TOOL_SLUGS).size).toBe(TOOL_COUNT);
  });
});

describe("tools", () => {
  it("exposes exactly the 2 expected tools, in display order", () => {
    expect(tools.map((tool) => tool.slug)).toEqual(EXPECTED_TOOL_SLUGS);
  });

  it("gives each tool its expected display name", () => {
    expect(Object.fromEntries(tools.map((t) => [t.slug, t.name]))).toEqual(
      TOOL_NAMES,
    );
  });

  it("keeps every slug unique", () => {
    expect(new Set(tools.map((tool) => tool.slug)).size).toBe(tools.length);
  });

  it("uses lower-case kebab-case slugs, so the URLs stay stable", () => {
    for (const tool of tools) {
      expect(tool.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("fills in every card field, so no card renders a blank", () => {
    for (const tool of tools) {
      expect(tool.name.length).toBeGreaterThan(0);
      expect(tool.applicationName.length).toBeGreaterThan(0);
      expect(tool.transform.length).toBeGreaterThan(0);
      expect(tool.tagline.length).toBeGreaterThan(0);
      expect(tool.highlights.length).toBeGreaterThan(0);
    }
  });
});

describe("getToolBySlug", () => {
  it("returns the tool for a known slug", () => {
    expect(getToolBySlug("csv-to-excel")?.name).toBe("CSV to Excel");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getToolBySlug("csv-to-pdf")).toBeUndefined();
  });
});

describe("requireTool", () => {
  it("returns the tool for a known slug", () => {
    expect(requireTool("excel-to-csv").name).toBe("Excel to CSV");
  });

  it("throws for an unknown slug, so a stale page fails the build", () => {
    expect(() => requireTool("csv-to-pdf")).toThrow("Unknown tool slug");
  });
});

describe("getToolPath", () => {
  it("nests every tool one segment under /tools", () => {
    expect(tools.map((tool) => getToolPath(tool.slug))).toEqual(
      EXPECTED_TOOL_PATHS,
    );
  });
});

describe("getOtherTools", () => {
  it("excludes the given tool and keeps the rest in order", () => {
    expect(getOtherTools("csv-to-excel").map((t) => t.slug)).toEqual([
      "excel-to-csv",
    ]);
  });

  it("returns every tool for an unknown slug", () => {
    expect(getOtherTools("csv-to-pdf").map((t) => t.slug)).toEqual(
      EXPECTED_TOOL_SLUGS,
    );
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Expected values
 *
 * Nothing below is derived from the code under test. These slugs are live URLs
 * that search engines have indexed, so a slug silently changing shape must fail
 * here. Order is meaningful and asserted: it is the hub page's card order.
 * ──────────────────────────────────────────────────────────────────────────── */

const TOOL_COUNT = 2;

const EXPECTED_TOOL_SLUGS = ["csv-to-excel", "excel-to-csv"];

const TOOL_NAMES: Record<string, string> = {
  "csv-to-excel": "CSV to Excel",
  "excel-to-csv": "Excel to CSV",
};

const EXPECTED_TOOL_PATHS = ["/tools/csv-to-excel", "/tools/excel-to-csv"];
