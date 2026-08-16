import type { ToolMeta } from "@/lib/tools";
import { getToolPath } from "@/lib/tools";

/**
 * `CollectionPage` + `ItemList` describing every free tool, so search engines
 * read `/tools` as the index of one category rather than a loose page. Built
 * from the registry, so the markup can never list a tool the hub doesn't show.
 */
export function computeToolsHubJsonLd(tools: ToolMeta[], baseUrl: string) {
  const hubUrl = new URL("/tools", baseUrl).toString();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": hubUrl,
        url: hubUrl,
        name: "Free CSV & Excel Tools",
        description:
          "Free, browser-based tools for converting between CSV and Excel files.",
      },
      {
        "@type": "ItemList",
        name: "Free CSV & Excel Tools",
        numberOfItems: tools.length,
        itemListElement: tools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "SoftwareApplication",
            name: tool.applicationName,
            url: new URL(getToolPath(tool.slug), baseUrl).toString(),
            applicationCategory: "BusinessApplication",
            operatingSystem: "Any (web browser)",
            description: tool.tagline,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          },
        })),
      },
    ],
  };
}
