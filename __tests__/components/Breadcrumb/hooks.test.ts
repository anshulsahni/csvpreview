import { computeBreadcrumbJsonLd } from "@/app/components/Breadcrumb/hooks";

describe("computeBreadcrumbJsonLd", () => {
  it("builds a BreadcrumbList with positions starting at 1", () => {
    const jsonLd = computeBreadcrumbJsonLd(
      [
        { label: "Home", href: "/" },
        { label: "Data", href: "/data" },
        { label: "Countries & capitals" },
      ],
      "https://csvpreview.com",
    );

    expect(jsonLd["@type"]).toBe("BreadcrumbList");
    expect(jsonLd.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://csvpreview.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Data",
        item: "https://csvpreview.com/data",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Countries & capitals",
      },
    ]);
  });

  it("resolves relative hrefs against baseUrl", () => {
    const jsonLd = computeBreadcrumbJsonLd(
      [{ label: "Geography", href: "/data/category/geography" }],
      "https://csvpreview.com",
    );

    expect(jsonLd.itemListElement[0].item).toBe(
      "https://csvpreview.com/data/category/geography",
    );
  });
});
