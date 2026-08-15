import type { BreadcrumbItem } from "./Breadcrumb";

/**
 * Build schema.org BreadcrumbList structured data for the given items.
 *
 * Items without an `href` (the current page) still get a `position` entry
 * but omit `item`, per the BreadcrumbList spec. Relative hrefs are resolved
 * against `baseUrl`.
 *
 * Pure and exported for unit testing.
 */
export function computeBreadcrumbJsonLd(
  items: BreadcrumbItem[],
  baseUrl: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: new URL(item.href, baseUrl).toString() } : {}),
    })),
  };
}
