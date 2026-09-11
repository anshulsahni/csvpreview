import { render } from "@testing-library/react";
import DatasetJsonLd from "@/app/components/DatasetJsonLd";
import type { DatasetMeta } from "@/lib/datasets/types";

const meta: DatasetMeta = {
  slug: "world-population",
  title: "World Population by Country & Territory (CSV)",
  description: "Population data for every country and territory.",
  keywords: ["world population"],
  firstRowAsHeader: true,
  lastModified: "2026-05-02",
};

function renderJsonLd(columns: string[]) {
  const { container } = render(
    <DatasetJsonLd
      meta={meta}
      path="/data/geography/world-population"
      baseUrl="https://csvpreview.com"
      columns={columns}
    />
  );

  const script = container.querySelector(
    'script[type="application/ld+json"]'
  );
  expect(script).not.toBeNull();

  return script as HTMLScriptElement;
}

describe("DatasetJsonLd", () => {
  it("emits parseable structured data", () => {
    const script = renderJsonLd(["Rank", "Country"]);

    expect(JSON.parse(script.innerHTML)).toMatchObject({
      "@type": "Dataset",
      name: meta.title,
      variableMeasured: ["Rank", "Country"],
    });
  });

  // CSV header rows land in `variableMeasured` verbatim, so a poisoned header
  // in a bundled dataset must not be able to close the script tag and inject
  // markup into the page.
  it("neutralises a column header that tries to break out of the script tag", () => {
    const hostile = 'Country</script><script>alert(1)</script>';
    const script = renderJsonLd(["Rank", hostile]);

    expect(script.innerHTML).not.toContain("</script");
    expect(JSON.parse(script.innerHTML).variableMeasured).toEqual([
      "Rank",
      hostile,
    ]);
  });
});
