import { computeToolsHubJsonLd } from "@/app/tools/components/toolsJsonLd";
import { SITE_URL } from "@/lib/brand";
import { tools } from "@/lib/tools";

// Expected values are hardcoded fixtures at the bottom of this file — they are
// only read inside `it` bodies, which run after the module finishes evaluating.

const getGraph = (baseUrl = SITE_URL) =>
  computeToolsHubJsonLd(tools, baseUrl)["@graph"];

const getCollectionPageUrl = (baseUrl = SITE_URL) =>
  (getGraph(baseUrl).find((node) => node["@type"] === "CollectionPage") as {
    url: string;
  }).url;

const getToolUrls = () =>
  (
    getGraph().find((node) => node["@type"] === "ItemList") as {
      itemListElement: { item: { url: string } }[];
    }
  ).itemListElement.map((entry) => entry.item.url);

describe("computeToolsHubJsonLd", () => {
  it("describes the hub itself as a CollectionPage at /tools", () => {
    expect(getCollectionPageUrl()).toBe("https://csvpreview.com/tools");
  });

  it("lists exactly the expected tool URLs, in the expected order", () => {
    expect(getToolUrls()).toEqual(EXPECTED_TOOL_URLS);
  });

  it("resolves URLs against the base URL it is given", () => {
    expect(getCollectionPageUrl("https://staging.example.com")).toBe(
      "https://staging.example.com/tools",
    );
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Expected values
 *
 * Nothing below is derived from the code under test. This markup is what search
 * engines read, so the exact absolute URLs are pinned: a tool silently
 * appearing, disappearing, or changing its URL shape must fail here.
 * ──────────────────────────────────────────────────────────────────────────── */

const EXPECTED_TOOL_URLS = [
  "https://csvpreview.com/tools/csv-to-excel",
  "https://csvpreview.com/tools/excel-to-csv",
];
