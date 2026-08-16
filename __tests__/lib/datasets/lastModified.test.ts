import { datasets } from "@/lib/datasets";

// Guards against a new dataset shipping without a `lastModified` date: the
// field is required on `DatasetMeta`, but TypeScript alone won't catch a
// nonsense value like "not-a-date" or "2026-13-40" slipping through.
describe("dataset lastModified", () => {
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

  it("has a lastModified field on every dataset", () => {
    expect(datasets.length).toBeGreaterThan(0);
    for (const ds of datasets) {
      expect(ds.lastModified).toBeDefined();
    }
  });

  it.each(datasets.map((ds) => [ds.slug, ds.lastModified] as const))(
    "%s has a YYYY-MM-DD lastModified",
    (_slug, lastModified) => {
      expect(lastModified).toMatch(ISO_DATE);
    },
  );

  it.each(datasets.map((ds) => [ds.slug, ds.lastModified] as const))(
    "%s has a real, parseable lastModified date",
    (_slug, lastModified) => {
      const parsed = new Date(lastModified);
      expect(Number.isNaN(parsed.getTime())).toBe(false);
      // Round-trips back to the same YYYY-MM-DD, catching e.g. "2026-02-30".
      expect(parsed.toISOString().slice(0, 10)).toBe(lastModified);
    },
  );
});
